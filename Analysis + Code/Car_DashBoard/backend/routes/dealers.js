const express = require('express');
const router = express.Router();
const dealerController = require('../controllers/dealerController');

router.get('/', dealerController.getDealers);
router.get('/list', dealerController.getDealerList);
router.get('/:dealerId', dealerController.getDealerById);

// Dealer analytics
router.get('/analytics/dealers', dealerController.getCarsByDealer);
router.get('/analytics/dealers-by-city', dealerController.getDealersByCity);
router.get('/analytics/dealer-locations', dealerController.getDealerLocations);
router.get('/analytics/top-dealers-accident', dealerController.getTopDealersByAccidentRatio);

// Profitability analytics
router.get('/analytics/dealer-profitability', dealerController.getDealerProfitability);

module.exports = router;