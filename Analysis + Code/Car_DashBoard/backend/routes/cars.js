
const express = require('express');
const router = express.Router();
const carController = require('../controllers/carController');

// Basic routes
router.get('/', carController.getCars);
router.get('/filter-options', carController.getFilterOptions);
router.get('/models', carController.getModelsByManufacturer);

// Static statistics for Overview page
router.get('/stats/price-by-manufacturer', carController.getPriceByManufacturer);
router.get('/stats/mileage-distribution', carController.getMileageDistribution);
router.get('/stats/accident-severity', carController.getAccidentStats);

// Filter page analytics
router.get('/analytics/model-distribution', carController.getModelDistribution);
router.get('/analytics/sales-distribution', carController.getSalesDistribution);


// Service analytics
router.get('/analytics/service-analytics', carController.getServiceAnalytics);
router.get('/analytics/service-timeline', carController.getServiceTimeline);
router.get('/analytics/service-by-dealer', carController.getServiceByDealer);
router.get('/analytics/service-cost-by-manufacturer', carController.getServiceCostByManufacturer);
router.get('/analytics/top-serviced-cars', carController.getTopServicedCars);
router.get('/analytics/service-cost-distribution', carController.getServiceCostDistribution);
router.get('/analytics/service-years', carController.getServiceYears);

// Profitability analytics
router.get('/analytics/profitability-summary', carController.getProfitabilitySummary);
router.get('/analytics/profitable-manufacturers', carController.getMostProfitableManufacturer);
router.get('/analytics/accident-impact', carController.getAccidentImpact);


module.exports = router;