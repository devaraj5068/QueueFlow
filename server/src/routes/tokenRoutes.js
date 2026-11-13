const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getTokens,
  createToken,
  assignNextToken,
  moveToken,
  cancelToken,
  completeToken,
} = require('../controllers/tokenController');
const { protect } = require('../middleware/authMiddleware');
const { validateTokenCreate } = require('../middleware/validationMiddleware');

// All token operations require manager authentication
router.use(protect);

router.route('/')
  .get(getTokens)
  .post(validateTokenCreate, createToken);

router.post('/assign-next', assignNextToken);
router.patch('/:tokenId/move', moveToken);
router.patch('/:tokenId/cancel', cancelToken);
router.patch('/:tokenId/complete', completeToken);

module.exports = router;
