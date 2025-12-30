const express = require('express');
const router = express.Router();
const Package = require('../models/PackageModel');
const LogModel = require('../models/Log');
const logger = require('../utils/logger');

/**
 * Endpoint: GET /api/packages
 * Returns available packages (catalog). Seeded on server start (see README).
 */
router.get('/', async (req, res) => {
  const pkgs = await Package.find().sort({ priceKES: 1 });
  res.json(pkgs);
});

module.exports = router;
