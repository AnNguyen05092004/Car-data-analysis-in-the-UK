// const Car = require('../models/Car');

// // 1. List all cars sold by each dealer, showing the number of cars sold and the total sales value per dealer
// // 4. Identify the most common service types performed in the last two years.
// // 7. Retrieve the full accident and service history for a specific car (by CarID).
// // 9. What is the distribution of cars by fuel type, and how does the average selling price vary across different fuel types?
// // 10. Find the top 3 dealers with the highest ratio of accident-prone cars to total cars sold.
// // 11. Identify the most profitable manufacturer based on total sales minus average repair costs per car.
// // 12. Compare the service frequency trend (number of services per year) across the last five years.
// // 15. Identify the most common features among cars priced above £25,000.
const Car = require('../models/Car');

// Get filtered cars with pagination
exports.getCars = async (req, res) => {
  try {
    const { 
      manufacturer, 
      model,
      car_id,
      fuel_type, 
      min_price, 
      max_price,
      min_year,
      max_year,
      page = 1,
      limit = 10
    } = req.query;

    const filter = {};
    
    if (manufacturer) filter.manufacturer = manufacturer;
    if (model) filter.model = model;
    if (car_id) filter._id = new RegExp(car_id, 'i'); // partial match
    if (fuel_type) filter['specifications.fuel_type'] = fuel_type;
    if (min_price || max_price) {
      filter['status.price'] = {};
      if (min_price) filter['status.price'].$gte = parseFloat(min_price);
      if (max_price) filter['status.price'].$lte = parseFloat(max_price);
    }
    if (min_year || max_year) {
      filter['specifications.year_of_manufacturing'] = {};
      if (min_year) filter['specifications.year_of_manufacturing'].$gte = parseInt(min_year);
      if (max_year) filter['specifications.year_of_manufacturing'].$lte = parseInt(max_year);
    }

    const cars = await Car.find(filter)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Car.countDocuments(filter);

    res.json({
      cars,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get price statistics by manufacturer
exports.getPriceByManufacturer = async (req, res) => {
  try {
    const stats = await Car.aggregate([
      {
        $group: {
          _id: '$manufacturer',
          avgPrice: { $avg: '$status.price' },
          minPrice: { $min: '$status.price' },
          maxPrice: { $max: '$status.price' },
          count: { $sum: 1 }
        }
      },
      { $sort: { avgPrice: -1 } }
    ]);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get mileage distribution
exports.getMileageDistribution = async (req, res) => {
  try {
    const distribution = await Car.aggregate([
      {
        $bucket: {
          groupBy: '$status.mileage',
          boundaries: [0, 20000, 40000, 60000, 80000, 100000, 200000],
          default: '200000+',
          output: {
            count: { $sum: 1 },
            avgPrice: { $avg: '$status.price' }
          }
        }
      }
    ]);

    res.json(distribution);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get accident severity statistics
exports.getAccidentStats = async (req, res) => {
  try {
    const stats = await Car.aggregate([
      { $unwind: '$accident_history' },
      {
        $group: {
          _id: '$accident_history.severity',
          count: { $sum: 1 },
          avgRepairCost: { $avg: '$accident_history.cost_of_repair' },
          totalRepairCost: { $sum: '$accident_history.cost_of_repair' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get filter options
exports.getFilterOptions = async (req, res) => {
  try {
    const manufacturers = await Car.distinct('manufacturer');
    const fuelTypes = await Car.distinct('specifications.fuel_type');
    const years = await Car.distinct('specifications.year_of_manufacturing');

    res.json({
      manufacturers: manufacturers.sort(),
      fuelTypes: fuelTypes.sort(),
      years: years.sort((a, b) => b - a)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get models by manufacturer
exports.getModelsByManufacturer = async (req, res) => {
  try {
    const { manufacturer } = req.query;
    const filter = manufacturer ? { manufacturer } : {};
    
    const models = await Car.distinct('model', filter);
    res.json(models.sort());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get model distribution with filters
exports.getModelDistribution = async (req, res) => {
  try {
    const { manufacturer } = req.query;
    const matchStage = manufacturer ? { manufacturer } : {};

    const stats = await Car.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: manufacturer ? '$model' : '$manufacturer',
          // if have manufacturer → group by MODEL
          // If NOT → group by MANUFACTURER
          count: { $sum: 1 },
          totalSales: { $sum: '$status.price' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get sales distribution
exports.getSalesDistribution = async (req, res) => {
  try {
    const { manufacturer } = req.query;
    const matchStage = manufacturer ? { manufacturer } : {};

    const stats = await Car.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: manufacturer ? '$model' : '$manufacturer',
          totalSales: { $sum: '$status.price' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalSales: -1 } }
    ]);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// -------------service analytics-------
// Get available service years
exports.getServiceYears = async (req, res) => {
  try {
    const years = await Car.aggregate([
      { $unwind: '$service_history' },
      {
        $addFields: {
          'service_history.date': {
            $cond: {
              if: { $eq: [{ $type: '$service_history.date' }, 'string'] },
              then: { $toDate: '$service_history.date' },
              else: '$service_history.date'
            }
          }
        }
      },
      {
        $group: {
          _id: { $year: '$service_history.date' }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    const yearList = years.map(y => y._id).filter(y => y != null);
    res.json(yearList);
  } catch (error) {
    console.error('Service Years Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Service analytics with advanced filters
exports.getServiceAnalytics = async (req, res) => {
  try {
    const { dealer_id, year, manufacturer } = req.query;
    
    let pipeline = [
      { $unwind: '$service_history' }
    ];

    // Match stage
    const matchConditions = {};
    if (dealer_id) matchConditions.dealer_id = dealer_id;
    if (manufacturer) matchConditions.manufacturer = manufacturer;
    
    if (Object.keys(matchConditions).length > 0) {
      pipeline.push({ $match: matchConditions });
    }

    // Convert date strings to Date objects
    pipeline.push({
      $addFields: {
        'service_history.date': {
          $cond: {
            if: { $eq: [{ $type: '$service_history.date' }, 'string'] },
            then: { $toDate: '$service_history.date' },
            else: '$service_history.date'
          }
        }
      }
    });

    // Filter by year if provided
    if (year) {
      pipeline.push({
        $match: {
          $expr: {
            $eq: [{ $year: '$service_history.date' }, parseInt(year)]
          }
        }
      });
    }

    // Percentage by service type
    const typeStats = await Car.aggregate([
      ...pipeline,
      {
        $group: {
          _id: '$service_history.type',
          count: { $sum: 1 },
          avgCost: { $avg: '$service_history.cost' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      byType: typeStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//  Service by month/year
exports.getServiceTimeline = async (req, res) => {
  try {
    const { year, manufacturer, dealer_id } = req.query;
    
    let pipeline = [
      { $unwind: '$service_history' }
    ];

    const matchConditions = {};
    if (manufacturer) matchConditions.manufacturer = manufacturer;
    if (dealer_id) matchConditions.dealer_id = dealer_id;
    
    if (Object.keys(matchConditions).length > 0) {
      pipeline.push({ $match: matchConditions });
    }

    pipeline.push({
      $addFields: {
        'service_history.date': {
          $cond: {
            if: { $eq: [{ $type: '$service_history.date' }, 'string'] },
            then: { $toDate: '$service_history.date' },
            else: '$service_history.date'
          }
        }
      }
    });

    if (year) {
      pipeline.push({
        $match: {
          $expr: { $eq: [{ $year: '$service_history.date' }, parseInt(year)] }
        }
      });

      pipeline.push({
        $group: {
          _id: { $month: '$service_history.date' },
          count: { $sum: 1 }
        }
      });
    } else {
      pipeline.push({
        $group: {
          _id: { $year: '$service_history.date' },
          count: { $sum: 1 }
        }
      });
    }

    pipeline.push({ $sort: { _id: 1 } });

    const stats = await Car.aggregate(pipeline);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//  Service count by dealer
exports.getServiceByDealer = async (req, res) => {
  try {
    const { manufacturer, year } = req.query;
    
    let pipeline = [
      { $unwind: '$service_history' }
    ];

    if (manufacturer) {
      pipeline.push({ $match: { manufacturer } });
    }

    pipeline.push({
      $addFields: {
        'service_history.date': {
          $cond: {
            if: { $eq: [{ $type: '$service_history.date' }, 'string'] },
            then: { $toDate: '$service_history.date' },
            else: '$service_history.date'
          }
        }
      }
    });

    if (year) {
      pipeline.push({
        $match: {
          $expr: { $eq: [{ $year: '$service_history.date' }, parseInt(year)] }
        }
      });
    }

    pipeline.push(
      {
        $group: {
          _id: '$dealer_id',
          count: { $sum: 1 },
          avgCost: { $avg: '$service_history.cost' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    );

    const stats = await Car.aggregate(pipeline);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Average service cost per manufacturer
exports.getServiceCostByManufacturer = async (req, res) => {
  try {
    const { dealer_id, year } = req.query;
    
    let pipeline = [
      { $unwind: '$service_history' }
    ];

    if (dealer_id) {
      pipeline.push({ $match: { dealer_id } });
    }

    pipeline.push({
      $addFields: {
        'service_history.date': {
          $cond: {
            if: { $eq: [{ $type: '$service_history.date' }, 'string'] },
            then: { $toDate: '$service_history.date' },
            else: '$service_history.date'
          }
        }
      }
    });

    if (year) {
      pipeline.push({
        $match: {
          $expr: { $eq: [{ $year: '$service_history.date' }, parseInt(year)] }
        }
      });
    }

    pipeline.push(
      {
        $group: {
          _id: '$manufacturer',
          avgCost: { $avg: '$service_history.cost' },
          count: { $sum: 1 }
        }
      },
      { $sort: { avgCost: -1 } }
    );

    const stats = await Car.aggregate(pipeline);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Service cost distribution
exports.getServiceCostDistribution = async (req, res) => {
  try {
    const stats = await Car.aggregate([
      { $unwind: '$service_history' },
      {
        $bucket: {
          groupBy: '$service_history.cost',
          boundaries: [0, 100, 200, 300, 400, 500, 1000],
          default: '1000+',
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Top cars with most services
exports.getTopServicedCars = async (req, res) => {
  try {
    const stats = await Car.aggregate([
      {
        $project: {
          _id: 1,
          manufacturer: 1,
          model: 1,
          dealer_id: 1,
          serviceCount: { $size: '$service_history' }
        }
      },
      { $match: { serviceCount: { $gt: 0 } } },
      { $sort: { serviceCount: -1 } },
      { $limit: 10 }
    ]);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ------------- profitability analytics-------
// Get summary KPIs for profitability
exports.getProfitabilitySummary = async (req, res) => {
  try {
    const summary = await Car.aggregate([
      {
        $project: {
          price: '$status.price',
          repairCost: { $sum: '$accident_history.cost_of_repair' },
          manufacturer: 1
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$price' },
          totalRepairCost: { $sum: '$repairCost' },
          carCount: { $sum: 1 }
        }
      },
      {
        $project: {
          totalSales: 1,
          totalRepairCost: 1,
          netProfit: { $subtract: ['$totalSales', '$totalRepairCost'] },
          carCount: 1
        }
      }
    ]);

    // Get most profitable manufacturer
    const topManufacturer = await Car.aggregate([
      {
        $project: {
          manufacturer: 1,
          price: '$status.price',
          repairCost: { $sum: '$accident_history.cost_of_repair' }
        }
      },
      {
        $group: {
          _id: '$manufacturer',
          totalSales: { $sum: '$price' },
          totalRepairCost: { $sum: '$repairCost' }
        }
      },
      {
        $project: {
          manufacturer: '$_id',
          profit: { $subtract: ['$totalSales', '$totalRepairCost'] }
        }
      },
      { $sort: { profit: -1 } },
      { $limit: 1 }
    ]);

    res.json({
      summary: summary[0] || {},
      topManufacturer: topManufacturer[0] || {}
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get most profitable manufacturer
exports.getMostProfitableManufacturer = async (req, res) => {
  try {
    const stats = await Car.aggregate([
      // Normalize data
      {
        $project: {
          manufacturer: 1,
          price: '$status.price',
          totalRepairCost: {
            $sum: '$accident_history.cost_of_repair'
          }
        }
      },
      
      {
        $group: {
          _id: '$manufacturer',
          totalSales: { $sum: '$price' },
          avgRepairCost: { $avg: '$totalRepairCost' },
          carCount: { $sum: 1 }
        }
      },

      // calculate profit
      {
        $project: {
          _id: 0,
          manufacturer: '$_id',
          totalSales: 1,
          avgRepairCost: 1,
          carCount: 1,
          profit: {
            $subtract: [
              '$totalSales',
              { $multiply: ['$avgRepairCost', '$carCount'] }
            ]
          }
        }
      },
      {
        $sort: { profit: -1 }
      }
    ]);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Dealer profitability...

// Accident impact on profit
exports.getAccidentImpact = async (req, res) => {
  try {
    const stats = await Car.aggregate([
      {
        $project: {
          manufacturer: 1,
          repairCost: { $sum: '$accident_history.cost_of_repair' },
          accidentCount: { $size: '$accident_history' },
          hasAccident: {
            $cond: {
              if: { $gt: [{ $size: '$accident_history' }, 0] },
              then: 1,
              else: 0
            }
          }
        }
      },
      {
        $group: {
          _id: '$manufacturer',
          avgRepairCost: { $avg: '$repairCost' },
          totalAccidents: { $sum: '$accidentCount' },
          carCount: { $sum: 1 },
          carsWithAccidents: { $sum: '$hasAccident' }
        }
      },
      {
        $project: {
          _id: 1,
          avgRepairCost: 1,
          totalAccidents: 1,
          carCount: 1,
          carsWithAccidents: 1,
          accidentRate: {
            $multiply: [
              { $divide: ['$carsWithAccidents', '$carCount'] },
              100
            ]
          }
        }
      },
      { $sort: { avgRepairCost: -1 } }
    ]);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




