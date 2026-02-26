import csv
from pathlib import Path
from datetime import datetime

# --- CONFIGURATION ---
INPUT_FILE = "CarSales_Dataset.csv"
OUT_DIR = Path("normalized_output_csv")
OUT_DIR.mkdir(exist_ok=True)

# --- COUNTERS ---
dealer_counter = 1
model_counter = 1
feature_counter = 1

# --- CONTAINERS (Dictionaries to ensure uniqueness) ---
dealers = {}       
models = {}        
cars = {}          
services = {}      
accidents = {}     
features = {}      

# relationship between Car and Feature
car_features_link = set()

# --- HELPER FUNCTION: DATE PARSING ---
def parse_date(date_str):
    if not date_str or date_str.strip() == "":
        return ""
    try:
        dt_obj = datetime.strptime(date_str, "%d/%m/%y")
        return dt_obj.strftime("%Y-%m-%d")
    except ValueError:
        return date_str

# --- MAIN PROCESSING ---
print(f"Reading {INPUT_FILE} and normalizing...")

with open(INPUT_FILE, newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    
    for row in reader:
        # 1. READ BASIC FIELDS
        # The get(key, '') function helps avoid errors if the column does not exist.
        car_id = row.get("CarID", "")

        # TABLE 1: DEALERS 
        # Create a unique key to identify Dealer
        dealer_key = (
            row["DealerName"], 
            row["DealerCity"], 
            row["Latitude"], 
            row["Longitude"]
        )
        
        if dealer_key not in dealers:
            dealers[dealer_key] = {
                "DealerID": f"D{str(dealer_counter).zfill(3)}",
                "DealerName": row["DealerName"],
                "DealerCity": row["DealerCity"],
                "Latitude": row["Latitude"],
                "Longitude": row["Longitude"]
            }
            dealer_counter += 1
            
        dealer_id = dealers[dealer_key]["DealerID"]

        # TABLE 2: MODELS 
        # Create a unique key to identify Model (Including Fuel Type)
        model_key = (
            row["Manufacturer"], 
            row["Model"], 
            row["Engine size"], 
            row["Fuel_Type"]
        )
        
        if model_key not in models:
            models[model_key] = {
                "ModelID": f"M{str(model_counter).zfill(3)}",
                "Manufacturer": row["Manufacturer"],
                "Model": row["Model"],
                "Engine size": row["Engine size"],
                "Fuel_Type": row["Fuel_Type"]
            }
            model_counter += 1
            
        model_id = models[model_key]["ModelID"]

        # TABLE 3: CARS (Fact)
        # Create skeleton if the car does not exist
        if car_id not in cars:
            cars[car_id] = {
                "CarID": car_id,
                "ModelID": model_id,
                "DealerID": dealer_id,
                "Year_of_Manufacturing": row["Year_of_Manufacturing"],
                "Mileage": row["Mileage"],
                "Price": row["Price"]
            }

        # TABLE 4: SERVICES
        service_id = row.get("ServiceID", "")
        # Only process if ServiceID exists and has not been processed before
        if service_id and service_id not in services:
            services[service_id] = {
                "ServiceID": service_id,
                "CarID": car_id,
                "Date_of_Service": parse_date(row.get("Date_of_Service", "")),
                "ServiceType": row.get("ServiceType", ""),
                "Cost_of_Service": row.get("Cost_of_Service", "")
            }

        # TABLE 5: ACCIDENTS
        accident_id = row.get("AccidentID", "")
        # Only process if AccidentID exists and has not been processed before
        if accident_id and accident_id not in accidents:
            accidents[accident_id] = {
                "AccidentID": accident_id,
                "CarID": car_id,
                "Date_of_Accident": parse_date(row.get("Date_of_Accident", "")),
                "Description": row.get("Description", ""),
                "Cost_of_Repair": row.get("Cost_of_Repair", ""),
                "Severity": row.get("Severity", "")
            }

        # TABLE 6 & 7: FEATURES & CAR_FEATURES
        feature_name = row.get("Features", "").strip()
        
        if feature_name:
            # A. If the Feature is new, add it to the definition table
            if feature_name not in features:
                features[feature_name] = {
                    "FeatureID": f"F{str(feature_counter).zfill(2)}",
                    "FeatureName": feature_name
                }
                feature_counter += 1
            
            feature_id = features[feature_name]["FeatureID"]
            
            # B. Add the relationship to the Link Table
            # Set automatically removes duplicates if the (CarID, FeatureID) pair already exists
            car_features_link.add((car_id, feature_id))


# --- WRITE OUTPUT FILES ---

def write_csv(filename, fieldnames, rows):
    print(f"Writing {filename}...")
    with open(OUT_DIR / filename, "w", newline='', encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

# 1. Dealers
write_csv("Dealers.csv", 
          ["DealerID", "DealerName", "DealerCity", "Latitude", "Longitude"], 
          list(dealers.values()))

# 2. Models
write_csv("Models.csv", 
          ["ModelID", "Manufacturer", "Model", "Engine size", "Fuel_Type"], 
          list(models.values()))

# 3. Cars
write_csv("Cars.csv", 
          ["CarID", "ModelID", "DealerID", "Year_of_Manufacturing", "Mileage", "Price"], 
          list(cars.values()))

# 4. Services
write_csv("Services.csv", 
          ["ServiceID", "CarID", "Date_of_Service", "ServiceType", "Cost_of_Service"], 
          list(services.values()))

# 5. Accidents
write_csv("Accidents.csv", 
          ["AccidentID", "CarID", "Date_of_Accident", "Description", "Cost_of_Repair", "Severity"], 
          list(accidents.values()))

# 6. Features (Definitions)
write_csv("Features.csv", 
          ["FeatureID", "FeatureName"], 
          list(features.values()))

# 7. Car_Features (Link Table)
# Convert set of tuples to list of dicts for CSV writing
car_features_rows = [{"CarID": c, "FeatureID": f} for c, f in car_features_link]
write_csv("Car_Features.csv", 
          ["CarID", "FeatureID"], 
          car_features_rows)

print(f"\n Done! Normalized CSV files generated in: {OUT_DIR.resolve()}")