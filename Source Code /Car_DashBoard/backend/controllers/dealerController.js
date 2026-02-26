const Dealer = require('../models/Dealer');
const Car = require('../models/Car');

// Get all dealers
exports.getDealers = async (req, res) => {
  try {
    const dealers = await Dealer.find();
    res.json(dealers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get dealer by ID with cars
exports.getDealerById = async (req, res) => {
  try {
    const { dealerId } = req.params;
    const dealer = await Dealer.findById(dealerId);
    
    if (!dealer) {
      return res.status(404).json({ message: 'Dealer not found' });
    }

    const cars = await Car.find({ dealer_id: dealerId });

    res.json({
      dealer,
      cars,
      totalCars: cars.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Get cars by dealer with filters
exports.getCarsByDealer = async (req, res) => {
  try {
    const { min_sales, max_sales, min_cars, sort_by = 'totalSalesValue' } = req.query;
    
    const pipeline = [
      {
        $group: {
          _id: '$dealer_id',
          totalCars: { $sum: 1 },
          totalSalesValue: { $sum: '$status.price' },
          avgPrice: { $avg: '$status.price' }
        }
      }
    ];

    // Add filters
    const matchStage = {};
    if (min_sales) matchStage.totalSalesValue = { $gte: parseFloat(min_sales) };
    if (max_sales) matchStage.totalSalesValue = { ...matchStage.totalSalesValue, $lte: parseFloat(max_sales) };
    if (min_cars) matchStage.totalCars = { $gte: parseInt(min_cars) };

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Sort
    let sortField = 'totalSalesValue';

    if (sort_by === 'cars') {
      sortField = 'totalCars';
    } else if (sort_by === 'avgPrice') {
      sortField = 'avgPrice';
    }
    pipeline.push({ $sort: { [sortField]: -1 } });

    const stats = await Car.aggregate(pipeline);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Get dealers by city
exports.getDealersByCity = async (req, res) => {
  try {
    const stats = await Dealer.aggregate([
      {
        $group: {
          _id: '$city',
          count: { $sum: 1 },
          dealers: { $push: { id: '$_id', name: '$name', location: '$location' } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get dealer locations for heatmap
exports.getDealerLocations = async (req, res) => {
  try {
    const dealers = await Dealer.find({}, { _id: 1, name: 1, city: 1, location: 1 });
    
    const locations = dealers.map(d => ({
      id: d._id,
      name: d.name,
      city: d.city,
      lat: d.location.coordinates[1],
      lng: d.location.coordinates[0]
    }));

    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get top dealers by accident ratio
exports.getTopDealersByAccidentRatio = async (req, res) => {
  try {
    const stats = await Car.aggregate([
      {
        $project: {
          dealer_id: 1,
          hasAccident: {
            $cond: { if: { $gt: [{ $size: { $ifNull: ["$accident_history", []] } }, 0] }, then: 1, else: 0 }
          }
        }
      },
      {
        $group: {
          _id: '$dealer_id',
          totalCars: { $sum: 1 },
          accidentCars: { $sum: '$hasAccident' }
        }
      },
      {
        $project: {
          dealer_id: '$_id',
          totalCars: 1,
          accidentCars: 1,
          accidentRatio: {
            $multiply: [
              { $divide: ['$accidentCars', '$totalCars'] },
              100
            ]
          }
        }
      },
      { $sort: { accidentRatio: -1 } },
      { $limit: 3 }
    ]);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get unique dealer IDs
exports.getDealerIds = async (req, res) => {
  try {
    const dealers = await Dealer.find({}, { _id: 1 }).sort({ _id: 1 });
    const dealerIds = dealers.map(d => d._id);
    res.json(dealerIds);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get dealer list for dropdown
exports.getDealerList = async (req, res) => {
  try {
    const dealers = await Dealer.find({}, { _id: 1, name: 1 }).sort({ _id: 1 });
    res.json(dealers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Dealer profitability
exports.getDealerProfitability = async (req, res) => {
  try {
    const stats = await Car.aggregate([
      {
        $project: {
          dealer_id: 1,
          price: '$status.price',
          repairCost: { $sum: '$accident_history.cost_of_repair' }
        }
      },
      {
        $group: {
          _id: '$dealer_id',
          totalSales: { $sum: '$price' },
          totalRepairCost: { $sum: '$repairCost' },
          carCount: { $sum: 1 }
        }
      },
      {
        $project: {
          dealer_id: '$_id',
          totalSales: 1,
          totalRepairCost: 1,
          carCount: 1,
          profit: { $subtract: ['$totalSales', '$totalRepairCost'] }
        }
      },
      { $sort: { profit: -1 } }
    ]);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = exports;