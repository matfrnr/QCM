const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { success, error } = require("../utils/response.js"); // Garde le .js si tu l'as ajouté

// Fonction pour mélanger un tableau
const shuffle = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// 1. Créer un QCM
exports.createQcm = async (req, res, next) => {
  try {
    const { title, question1, question2 } = req.body;

    const createQuestionWithPropositions = async (qData) => {
      const question = await prisma.question.create({
        data: {
          text: qData.text,
          propositions: {
            create: qData.propositions.map((p) => ({ text: p.text })),
          },
        },
        include: { propositions: true },
      });

      const correctPropData = qData.propositions.find((p) => p.isCorrect);
      const correctPropDb = question.propositions.find(
        (p) => p.text === correctPropData.text,
      );

      const finalQuestion = await prisma.question.update({
        where: { id: question.id },
        data: { proposition_good_id: correctPropDb.id },
      });

      return finalQuestion.id;
    };

    const q1Id = await createQuestionWithPropositions(question1);
    const q2Id = await createQuestionWithPropositions(question2);

    const newQcm = await prisma.qcm.create({
      data: { title, question1Id: q1Id, question2Id: q2Id },
      include: {
        question1: { include: { propositions: true } },
        question2: { include: { propositions: true } },
      },
    });

    return success(res, newQcm, 201);
  } catch (err) {
    next(err);
  }
};

// 2. Récupérer tous les QCMs
exports.getAllQcms = async (req, res, next) => {
  try {
    const qcms = await prisma.qcm.findMany();
    return success(res, qcms);
  } catch (err) {
    next(err);
  }
};

// 3. Récupérer un QCM par ID (avec les propositions mélangées)
exports.getQcmById = async (req, res, next) => {
  try {
    const qcm = await prisma.qcm.findUnique({
      where: { id: req.params.id },
      include: {
        question1: {
          include: { propositions: { select: { id: true, text: true } } },
        },
        question2: {
          include: { propositions: { select: { id: true, text: true } } },
        },
      },
    });
    if (!qcm) return error(res, "QCM non trouvé", 404);

    // On regroupe les 2 questions dans un tableau et on mélange tout
    const questions = [qcm.question1, qcm.question2];
    questions.forEach((q) => {
      q.propositions = shuffle(q.propositions);
    });

    return success(res, {
      id: qcm.id,
      title: qcm.title,
      questions: shuffle(questions),
    });
  } catch (err) {
    next(err);
  }
};

// 4. Obtenir la prochaine question (Celle qui causait l'erreur 500)
exports.getNextQuestion = async (req, res, next) => {
  try {
    const { id: qcmId } = req.params;
    const userId = req.user.id;

    const qcm = await prisma.qcm.findUnique({
      where: { id: qcmId },
      include: {
        question1: {
          include: {
            propositions: { select: { id: true, text: true } },
            responses: { where: { userId } }, // On regarde si l'utilisateur y a déjà répondu
          },
        },
        question2: {
          include: {
            propositions: { select: { id: true, text: true } },
            responses: { where: { userId } },
          },
        },
      },
    });

    if (!qcm) return error(res, "QCM non trouvé", 404);

    const openQuestions = [];
    if (qcm.question1.responses.length === 0) openQuestions.push(qcm.question1);
    if (qcm.question2.responses.length === 0) openQuestions.push(qcm.question2);

    if (openQuestions.length === 0) {
      return success(res, { message: "QCM terminé !", finished: true });
    }

    const nextQuestion = shuffle(openQuestions)[0];
    nextQuestion.propositions = shuffle(nextQuestion.propositions);
    delete nextQuestion.responses; // On masque la réponse de la base

    return success(res, { ...nextQuestion, finished: false });
  } catch (err) {
    next(err);
  }
};

// 5. Soumettre une réponse
exports.submitResponse = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { questionId, propositionId } = req.body;
    const { id: qcmId } = req.params;

    const qcm = await prisma.qcm.findUnique({ where: { id: qcmId } });

    // On s'assure que l'ID de la question correspond bien à l'une des 2 questions de CE QCM
    if (
      !qcm ||
      (qcm.question1Id !== questionId && qcm.question2Id !== questionId)
    ) {
      return error(res, "La question n'appartient pas à ce QCM", 400);
    }

    await prisma.response.upsert({
      where: { userId_questionId: { userId, questionId } },
      update: { propositionId },
      create: { userId, questionId, propositionId },
    });

    return success(res, { message: "Réponse enregistrée" });
  } catch (err) {
    next(err);
  }
};

// 6. Obtenir le résultat
exports.getQcmResult = async (req, res, next) => {
  try {
    const { id: qcmId } = req.params;
    const userId = req.user.id;

    const qcm = await prisma.qcm.findUnique({
      where: { id: qcmId },
      include: {
        question1: { include: { responses: { where: { userId } } } },
        question2: { include: { responses: { where: { userId } } } },
      },
    });

    if (!qcm) return error(res, "QCM non trouvé", 404);

    let correctAnswers = 0;

    // On compare l'ID de la proposition choisie par le user avec la bonne réponse (relation 1/1 de ta base)
    if (
      qcm.question1.responses.length > 0 &&
      qcm.question1.responses[0].propositionId ===
        qcm.question1.proposition_good_id
    ) {
      correctAnswers++;
    }
    if (
      qcm.question2.responses.length > 0 &&
      qcm.question2.responses[0].propositionId ===
        qcm.question2.proposition_good_id
    ) {
      correctAnswers++;
    }

    return success(res, { score: `${correctAnswers} / 2` });
  } catch (err) {
    next(err);
  }
};

// 7. Supprimer un QCM et ses questions associées
exports.deleteQcm = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Chercher le QCM pour récupérer les IDs de ses questions
    const qcm = await prisma.qcm.findUnique({ where: { id } });
    if (!qcm) return error(res, "QCM non trouvé", 404);

    // 2. Supprimer d'abord le QCM (pour enlever le lien de clé étrangère)
    await prisma.qcm.delete({ where: { id } });

    // 3. Supprimer les 2 questions associées
    // (Les propositions et réponses seront supprimées automatiquement grâce au onDelete: Cascade de la base de données)
    await prisma.question.delete({ where: { id: qcm.question1Id } });
    await prisma.question.delete({ where: { id: qcm.question2Id } });

    return success(res, { message: "QCM et questions supprimés avec succès" });
  } catch (err) {
    next(err);
  }
};
