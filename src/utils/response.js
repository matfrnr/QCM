/**
 * Helpers pour des réponses JSON cohérentes
 */

const success = (res, data = {}, statusCode = 200, message = null) => {
  return res.status(statusCode).json({
    success: true,
    ...(message && { message }),
    data,
  });
};

const created = (res, data = {}, message = 'Ressource créée avec succès.') => {
  return success(res, data, 201, message);
};

const noContent = (res) => res.status(204).send();

const error = (res, message = 'Erreur interne.', statusCode = 500, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
  });
};

module.exports = { success, created, noContent, error };
