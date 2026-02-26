Note: check state in mongoDB add: .explain("executionStats")

1. List all cars sold by each dealer, showing the number of cars sold and the total sales value per dealer.
-- sql
SELECT 
    d.DealerID,
    d.DealerName,
    COUNT(c.CarID) AS total_cars_sold,
    SUM(c.Price) AS total_sales_value
FROM Dealers d
LEFT JOIN Cars c ON d.DealerID = c.DealerID
GROUP BY d.DealerID, d.DealerName
ORDER BY total_sales_value DESC;

-- mongoDB
db.cars.aggregate([
  // Step 1: Group by dealer_id to calculate totals
  {
    $group: {
      _id: "$dealer_id",
      total_cars_sold: { $sum: 1 },
      total_sales_value: { $sum: "$status.price" }
    }
  },
  // Step 2: Join with the 'dealers' collection to get the Dealer Name
  {
    $lookup: {
      from: "dealers",
      localField: "_id",
      foreignField: "_id",
      as: "dealer_info"
    }
  },
  // Step 3: Format the output (Unwind array and Project fields)
  {
    $project: {
      dealer_name: { $arrayElemAt: ["$dealer_info.name", 0] },
      total_cars_sold: 1,
      total_sales_value: 1
    }
  },
  // Step 4: Sort by total sales value descending
  {
    $sort: { total_sales_value: -1 }
  }
]);


2.	Calculate the average selling price by manufacturer and year of manufacturing.
-- sql
SELECT 
    m.Manufacturer, 
    c.Year_of_Manufacturing, 
    AVG(c.Price) AS AveragePrice
FROM 
    Cars c
JOIN 
    Models m ON c.ModelID = m.ModelID
GROUP BY 
    m.Manufacturer, 
    c.Year_of_Manufacturing
ORDER BY 
    m.Manufacturer ASC, 
    c.Year_of_Manufacturing DESC;

-- mongoDB
db.cars.aggregate([
  // Step 1: Group by Manufacturer and Year
  {
    $group: {
      _id: { 
        manufacturer: "$manufacturer", 
        year: "$specifications.year_of_manufacturing" 
      },
      average_price: { $avg: "$status.price" }
    }
  },
  // Step 2: Sort the results to match SQL output
  {
    $sort: { 
      "_id.manufacturer": 1, 
      "_id.year": -1 
    }
  },
  // Step 3: Optional - Format output for cleaner reading
  {
    $project: {
      _id: 0,
      manufacturer: "$_id.manufacturer",
      year: "$_id.year",
      average_price: 1
    }
  }
]);

3.	Find all cars that have been involved in more than two accidents.
-- sql
SELECT 
    CarID, 
    COUNT(AccidentID) AS AccidentCount
FROM 
    Accidents
GROUP BY 
    CarID
HAVING 
    COUNT(AccidentID) > 2;

-- mongoDB
db.cars.aggregate([
  {
    $project: {
      
      accident_count: { 
        $size: { $ifNull: ["$accident_history", []] } 
      }
    }
  },
  {
    $match: { 
      accident_count: { $gt: 2 } 
    }
  },
  {
    $sort: { _id: 1 }
  }
]);

4.	Identify the most common service types performed in the last two years.
-- sql
SELECT 
    ServiceType, 
    COUNT(*) AS Frequency
FROM 
    Services
WHERE 
    Date_of_Service >= DATE_SUB(CURDATE(), INTERVAL 2 YEAR)
GROUP BY 
    ServiceType
ORDER BY 
    Frequency DESC;

-- mongoDB
db.cars.aggregate([
  // Step 1: Deconstruct the service_history array
  { $unwind: "$service_history" },
  
  // Step 2: Filter by date (Assuming ISO string format 'YYYY-MM-DD')
  { 
    $match: { 
      "service_history.date": { 
        $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 2)).toISOString().split('T')[0] 
      } 
    } 
  },
  
  // Step 3: Group by Service Type
  {
    $group: {
      _id: "$service_history.type",
      frequency: { $sum: 1 }
    }
  },
  
  // Step 4: Sort by frequency
  { $sort: { frequency: -1 } }
]);

5.	Find all cars with a total accident repair cost exceeding £2,000, listing total cost and number of incidents.
-- sql
SELECT 
    CarID, 
    SUM(Cost_of_Repair) AS TotalRepairCost, 
    COUNT(AccidentID) AS IncidentCount
FROM 
    Accidents
GROUP BY 
    CarID
HAVING 
    SUM(Cost_of_Repair) > 2000;

-- mongoDB
db.cars.aggregate([
  // Step 1: Flatten the accident history
  { $unwind: "$accident_history" },

  // Step 2: Group by Car ID to calculate sums
  {
    $group: {
      _id: "$_id", // CarID
      total_repair_cost: { $sum: "$accident_history.cost_of_repair" },
      incident_count: { $sum: 1 }
    }
  },

  // Step 3: Filter based on total cost
  {
    $match: {
      total_repair_cost: { $gt: 2000 }
    }
  },
  {
    $sort: { _id: 1 }
  }
]);

6.	Calculate the average mileage per fuel type and engine size category (e.g., <1.5L, 1.5–2.5L, >2.5L).
-- sql
SELECT 
    m.Fuel_Type,
    CASE 
        WHEN m.EngineSize < 1.5 THEN '<1.5L'
        WHEN m.EngineSize BETWEEN 1.5 AND 2.5 THEN '1.5-2.5L'
        ELSE '>2.5L'
    END AS EngineCategory,
    AVG(c.Mileage) AS AverageMileage
FROM 
    Cars c
JOIN 
    Models m ON c.ModelID = m.ModelID
GROUP BY 
    m.Fuel_Type, 
    EngineCategory
ORDER BY 
    m.Fuel_Type, 
    EngineCategory;

-- mongoDB
db.cars.aggregate([
  // Step 1: Create the Engine Category field dynamically
  {
    $project: {
      fuel_type: "$specifications.fuel_type",
      mileage: "$status.mileage",
      engine_category: {
        $switch: {
          branches: [
            { case: { $lt: ["$specifications.engine_size", 1.5] }, then: "<1.5L" },
            { case: { $and: [ { $gte: ["$specifications.engine_size", 1.5] }, { $lte: ["$specifications.engine_size", 2.5] } ] }, then: "1.5-2.5L" }
          ],
          default: ">2.5L"
        }
      }
    }
  },
  // Step 2: Group by Fuel Type and the new Category
  {
    $group: {
      _id: { 
        fuel_type: "$fuel_type", 
        engine_category: "$engine_category" 
      },
      average_mileage: { $avg: "$mileage" }
    }
  }
]);

7.	Retrieve the full accident and service history for a specific car (by CarID).
-- sql
-- Get Car and Service History
SELECT * FROM Services WHERE CarID = 'C33554';

-- Get Car and Accident History
SELECT * FROM Accidents WHERE CarID = 'C33554';

-- mongoDB
db.cars.findOne({ _id: "C33554" });

8.	List all cars older than 10 years that have undergone more than two services.
-- sql
SELECT 
    c.CarID, 
    c.Year_of_Manufacturing, 
    COUNT(s.ServiceID) AS ServiceCount
FROM 
    Cars c
JOIN 
    Services s ON c.CarID = s.CarID
WHERE 
    (YEAR(CURDATE()) - c.Year_of_Manufacturing) > 10
GROUP BY 
    c.CarID
HAVING 
    COUNT(s.ServiceID) > 2;

-- mongoDB
const thisYear = new Date().getFullYear();
db.cars.find(
  {
    $expr: {
      $and: [
        { $gt: [ { $subtract: [thisYear, "$specifications.year_of_manufacturing"] }, 10 ] },
        { $gt: [ { $size: { $ifNull: ["$service_history", []] } }, 2 ] }
      ]
    }
  },
  {
    _id: 1,
    specifications: 1,
    service_history: 1
  },
  { sort: { _id: 1 } }
)


9.	What is the distribution of cars by fuel type, and how does the average selling price vary across different fuel types?
-- sql
SELECT 
    m.Fuel_Type, 
    COUNT(c.CarID) AS NumberOfCars, 
    AVG(c.Price) AS AverageSellingPrice
FROM 
    Cars c
JOIN 
    Models m ON c.ModelID = m.ModelID
GROUP BY 
    m.Fuel_Type

-- mongoDB
db.cars.aggregate([
  {
    $group: {
      _id: "$specifications.fuel_type",
      number_of_cars: { $sum: 1 },
      average_selling_price: { $avg: "$status.price" }
    }
  }
]);

10.	Find the top 3 dealers with the highest ratio of accident-prone cars to total cars sold.
-- sql
SELECT 
    d.DealerName,
    COUNT(DISTINCT c.CarID) AS TotalCarsSold,
    COUNT(DISTINCT a.CarID) AS CarsWithAccidents,
    (COUNT(DISTINCT a.CarID) / COUNT(DISTINCT c.CarID)) * 100 AS AccidentProneRatio
FROM Dealers d
JOIN Cars c ON d.DealerID = c.DealerID
LEFT JOIN Accidents a ON c.CarID = a.CarID
GROUP BY d.DealerName
ORDER BY AccidentProneRatio DESC
LIMIT 3;

-- mongoDB
db.cars.aggregate([
  // Step 1: Determine if each car is accident-prone
  {
    $project: {
      dealer_id: 1,
      is_accident_prone: { 
        $cond: { if: { $gt: [{ $size: { $ifNull: ["$accident_history", []] } }, 0] }, then: 1, else: 0 }
      }
    }
  },
  // Step 2: Group by Dealer to calculate ratio
  {
    $group: {
      _id: "$dealer_id",
      total_cars: { $sum: 1 },
      accident_cars: { $sum: "$is_accident_prone" }
    }
  },
  // Step 3: Calculate Percentage
  {
    $project: {
      dealer_id: "$_id",
      ratio: { $multiply: [{ $divide: ["$accident_cars", "$total_cars"] }, 100] }
    }
  },
  // Step 4: Sort and Limit
  { $sort: { ratio: -1 } },
  { $limit: 3 }
]);

11.	Identify the most profitable manufacturer based on total sales minus average repair costs per car.
-- sql
SELECT 
    m.Manufacturer,
    SUM(c.Price - COALESCE(car_accidents.TotalRepairCost, 0)) AS NetValue
FROM Cars c
JOIN Models m ON c.ModelID = m.ModelID
LEFT JOIN (
    -- Subquery: Pre-calculate accident costs per car
    SELECT CarID, SUM(Cost_of_Repair) AS TotalRepairCost
    FROM Accidents
    GROUP BY CarID
) car_accidents ON c.CarID = car_accidents.CarID
GROUP BY m.Manufacturer
ORDER BY NetValue DESC
LIMIT 1;

-- mongoDB
db.cars.aggregate([
  // Step 1: Calculate total repair cost per car (sum of the array)
  {
    $project: {
      manufacturer: 1,
      revenue: "$status.price",
      repair_liability: { $sum: "$accident_history.cost_of_repair" }
    }
  },
  // Step 2: Group by Manufacturer
  {
    $group: {
      _id: "$manufacturer",
      total_net_profit: { 
        $sum: { $subtract: ["$revenue", "$repair_liability"] } 
      }
    }
  },
  // Step 3: Find the top one
  { $sort: { total_net_profit: -1 } },
  { $limit: 1 }
]);

12.	Compare the service frequency trend (number of services per year) across the last five years.
-- sql
SELECT 
    YEAR(Date_of_Service) AS ServiceYear,
    COUNT(*) AS TotalServices
FROM Services
WHERE Date_of_Service >= DATE_SUB(CURDATE(), INTERVAL 5 YEAR)
GROUP BY ServiceYear
ORDER BY ServiceYear ASC;

-- mongoDB
db.cars.aggregate([
  { $unwind: "$service_history" },
  {
    $project: {
      year: { $substr: ["$service_history.date", 0, 4] } 
    }
  },
  {
    $match: {
      year: { $gte: "2020" }
    }
  },
  {
    $group: {
      _id: "$year",
      total_services: { $sum: 1 }
    }
  },
  { $sort: { _id: 1 } }
]);

13.	Find cars that have not been serviced in the last 24 months but have recorded accidents in the same period.
-- sql
SELECT DISTINCT c.CarID
FROM Cars c
JOIN Accidents a ON c.CarID = a.CarID
WHERE a.Date_of_Accident >= DATE_SUB(CURDATE(), INTERVAL 24 MONTH)
    AND NOT EXISTS (
        SELECT 1 
        FROM Services s 
        WHERE s.CarID = c.CarID 
          AND s.Date_of_Service >= DATE_SUB(CURDATE(), INTERVAL 24 MONTH));

-- mongoDB
// Calculate the date string for 24 months ago 
var dateThreshold = new Date();
dateThreshold.setMonth(dateThreshold.getMonth() - 24);
var dateString = dateThreshold.toISOString().split('T')[0];

db.cars.find({
  $and: [
    // Cond1: At least one accident after the threshold
    { "accident_history": { 
        $elemMatch: { "date": { $gte: dateString } } 
    }},
    // Cond2: No services after the threshold
    { "service_history": { 
        $not: { 
            $elemMatch: { "date": { $gte: dateString } } 
        } 
    }}
  ]
}, { _id: 1}, { sort: { _id: 1 } });

14.	Compare the severity distribution of accidents (e.g., Minor, Moderate, Major) across all cars, grouped by manufacturer.
-- sql
SELECT 
    m.Manufacturer, 
    a.Severity, 
    COUNT(*) AS IncidentCount
FROM Accidents a
JOIN Cars c ON a.CarID = c.CarID
JOIN Models m ON c.ModelID = m.ModelID
GROUP BY m.Manufacturer, a.Severity
ORDER BY m.Manufacturer, IncidentCount DESC;

-- mongoDB
db.cars.aggregate([
  { $unwind: "$accident_history" },
  {
    $group: {
      _id: { 
        manufacturer: "$manufacturer", 
        severity: "$accident_history.severity" 
      },
      incident_count: { $sum: 1 }
    }
  },
  { 
    $sort: { 
      "_id.manufacturer": 1, 
      incident_count: -1 
    } 
  }
]);

15.	Identify the most common features among cars priced above £25,000.
-- sql
SELECT 
    f.FeatureName, 
    COUNT(cf.CarID) AS Frequency
FROM Cars c
JOIN Car_Features cf ON c.CarID = cf.CarID
JOIN Features f ON cf.FeatureID = f.FeatureID
WHERE c.Price > 25000
GROUP BY f.FeatureName
ORDER BY Frequency DESC

-- mongoDB
db.cars.aggregate([
  { 
    $match: { "status.price": { $gt: 25000 } } 
  },
  { $unwind: "$features" },
  {
    $group: {
      _id: "$features",
      frequency: { $sum: 1 }
    }
  },
  { $sort: { frequency: -1 } },
]);