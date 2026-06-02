const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { success, error } = require("../utils/response");

// Fonction pour mélanger un tableau (ordre aléatoire)
const shuffle = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// Créer un QCM
exports.createQcm = async (req, res, next) => {
  try {
    const { title, questions } = req.body;

    const newQcm = await prisma.qcm.create({
      data: {
        title,
        questions: {
          create: questions.map((q) => ({
            text: q.text,
            propositions: {
              create: q.propositions.map((p) => ({
                text: p.text,
                isCorrect: p.isCorrect,
              })),
            },
          })),
        },
      },
      include: { questions: { include: { propositions: true } } },
    });

    return success(res, newQcm, 201);
  } catch (err) {
    next(err);
  }
};

// Récupérer tous les QCMs
exports.getAllQcms = async (req, res, next) => {
  try {
    const qcms = await prisma.qcm.findMany();
    return success(res, qcms);
  } catch (err) {
    next(err);
  }
};

// Récupérer un QCM par ID (avec propositions mélangées)
exports.getQcmById = async (req, res, next) => {
  try {
    const qcm = await prisma.qcm.findUnique({
      where: { id: req.params.id },
      include: {
        questions: {
          include: { propositions: { select: { id: true, text: true } } },
        },
      },
    });
    if (!qcm) return error(res, "QCM non trouvé", 404);

    qcm.questions = shuffle(qcm.questions);
    qcm.questions.forEach((q) => (q.propositions = shuffle(q.propositions)));

    return success(res, qcm);
  } catch (err) {
    next(err);
  }
};

// Obtenir la prochaine question disponible
exports.getNextQuestion = async (req, res, next) => {
  try {
    const { id: qcmId } = req.params;
    const userId = req.user.id;

    const openQuestions = await prisma.question.findMany({
      where: {
        qcmId,
        responses: { none: { userId } }, // Questions où l'utilisateur n'a pas de réponse
      },
      include: { propositions: { select: { id: true, text: true } } },
    });

    if (openQuestions.length === 0) {
      return success(res, { message: "QCM terminé !", finished: true });
    }

    const nextQuestion = shuffle(openQuestions)[0];
    nextQuestion.propositions = shuffle(nextQuestion.propositions);

    return success(res, { ...nextQuestion, finished: false });
  } catch (err) {
    next(err);
  }
};

// Soumettre une réponse
exports.submitResponse = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { questionId, propositionId } = req.body;

    const userResponse = await prisma.response.upsert({
      where: { userId_questionId: { userId, questionId } },
      update: { propositionId },
      create: { userId, questionId, propositionId },
      include: { proposition: true },
    });

    return success(res, { message: "Réponse enregistrée" });
  } catch (err) {
    next(err);
  }
};

// Obtenir le résultat
exports.getQcmResult = async (req, res, next) => {
  try {
    const { id: qcmId } = req.params;
    const userId = req.user.id;

    const totalQuestions = await prisma.question.count({ where: { qcmId } });
    const correctAnswers = await prisma.response.count({
      where: { userId, question: { qcmId }, proposition: { isCorrect: true } },
    });

    return success(res, { score: `${correctAnswers} / ${totalQuestions}` });
  } catch (err) {
    next(err);
  }
};
