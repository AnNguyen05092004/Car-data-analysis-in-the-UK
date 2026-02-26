CREATE DATABASE IF NOT EXISTS car_sales;
USE car_sales;

-- Table 1: Dealers
-- Stores dealer information with geographic coordinates 
CREATE TABLE Dealers (
    DealerID VARCHAR(10) PRIMARY KEY,
    DealerName VARCHAR(255) NOT NULL,
    DealerCity VARCHAR(100),
    Latitude DECIMAL(10, 6),
    Longitude DECIMAL(10, 6)
);

-- Table 2: Models
-- Normalized car model specifications to avoid data redundancy
CREATE TABLE Models (
    ModelID VARCHAR(10) PRIMARY KEY,
    Manufacturer VARCHAR(100),
    ModelName VARCHAR(100),
    EngineSize FLOAT,
    Fuel_Type VARCHAR(50)
);

-- Table 3: Features
-- Master list of available car features for many-to-many relationship
CREATE TABLE Features (
    FeatureID VARCHAR(10) PRIMARY KEY,
    FeatureName VARCHAR(100) UNIQUE
);

-- Table 4: Cars
-- Central fact table containing car inventory with references to dealers and models
CREATE TABLE Cars (
    CarID VARCHAR(20) PRIMARY KEY,
    ModelID VARCHAR(10),
    DealerID VARCHAR(10),
    Year_of_Manufacturing INT,
    Mileage INT,
    Price DECIMAL(12, 2),
    
    FOREIGN KEY (ModelID) REFERENCES Models(ModelID) 
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (DealerID) REFERENCES Dealers(DealerID) 
        ON UPDATE CASCADE ON DELETE RESTRICT
);

-- Table 5: Services
-- Service history records for each car with cost tracking
CREATE TABLE Services (
    ServiceID VARCHAR(20) PRIMARY KEY,
    CarID VARCHAR(20),
    Date_of_Service DATE,
    ServiceType VARCHAR(255),
    Cost_of_Service DECIMAL(10, 2),
    
    FOREIGN KEY (CarID) REFERENCES Cars(CarID)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table 6: Accidents
-- Accident history with severity levels and repair costs
CREATE TABLE Accidents (
    AccidentID VARCHAR(20) PRIMARY KEY,
    CarID VARCHAR(20),
    Date_of_Accident DATE,
    Description TEXT,
    Cost_of_Repair DECIMAL(10, 2),
    Severity VARCHAR(50),
    
    FOREIGN KEY (CarID) REFERENCES Cars(CarID)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table 7: Car_Features
-- Junction table establishing many-to-many relationship between cars and features
CREATE TABLE Car_Features (
    CarID VARCHAR(20),
    FeatureID VARCHAR(10),
    
    PRIMARY KEY (CarID, FeatureID),
    
    FOREIGN KEY (CarID) REFERENCES Cars(CarID) 
        ON DELETE CASCADE,
    FOREIGN KEY (FeatureID) REFERENCES Features(FeatureID) 
        ON DELETE RESTRICT
);