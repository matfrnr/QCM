const express = require("express");
const authRoutes = require("./auth");
const usersRoutes = require("./users");
const qcmsRoutes = require("./qcms").default; // <-- On importe nos routes QCM

const router = express.Router();

// Route de santé de l'API
router.get("/health", (req, res) => {
  res.json({ status: "ok", service: "qcm-service" });
});

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/qcms", qcmsRoutes); // <-- On les branche ici

module.exports = router;
