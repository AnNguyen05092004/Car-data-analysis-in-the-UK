import csv
import json
from datetime import datetime

# --- CONFIGURATION ---
INPUT_FILE = 'CarSales_Dataset.csv'
DEALER_OUTPUT = 'dealers_nosql.json'
CAR_OUTPUT = 'cars_nosql.json'

def parse_date(date_str):
    if not date_str or date_str.strip() == "":
        return None
    try:
        return datetime.strptime(date_str, "%d/%m/%y").strftime("%Y-%m-%d")
    except ValueError:
        return None

def convert_csv_to_json_pure_python():
    # 1. Containers
    # Dealers: Use dict for quick duplicate checking, List for final results
    dealers_map = {}  # Key: (Name, City, Lat, Lon) -> Value: DealerID
    dealers_list = [] # List of complete Dealer dicts
    
    # Cars: Use dict to group data
    cars_data = {}    # Key: CarID -> Value: Car Document

    # Counter for Dealer ID
    dealer_counter = 1

    with open(INPUT_FILE, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            # A. DEALER (Extract and assign ID)
            # -------------------------------------------------
            dealer_key = (
                row['DealerName'], 
                row['DealerCity'], 
                row['Latitude'], 
                row['Longitude']
            )

            if dealer_key not in dealers_map:
                # Create new Dealer ID (D001, D002...)
                dealer_id = f"D{str(dealer_counter).zfill(3)}"
                dealers_map[dealer_key] = dealer_id
                dealer_counter += 1

                # Create GeoJSON structure for Dealer
                try:
                    lat = float(row['Latitude'])
                    lon = float(row['Longitude'])
                except ValueError:
                    lat, lon = 0.0, 0.0

                dealers_list.append({
                    "_id": dealer_id,
                    "name": row['DealerName'],
                    "city": row['DealerCity'],
                    "location": {
                        "type": "Point",
                        "coordinates": [lon, lat] # GeoJSON: [Longitude, Latitude]
                    }
                })   
            # Get current Dealer ID for reference in Car documents
            current_dealer_id = dealers_map[dealer_key]

            # B. CAR (Create skeleton or update)
            car_id = row['CarID']

            if car_id not in cars_data:
                # If car does not exist, create skeleton (Skeleton)
                cars_data[car_id] = {
                    "_id": car_id,
                    "manufacturer": row['Manufacturer'],
                    "model": row['Model'],
                    "specifications": {
                        "engine_size": float(row['Engine size']) if row['Engine size'] else 0.0,
                        "fuel_type": row['Fuel_Type'],
                        "year_of_manufacturing": int(row['Year_of_Manufacturing']) if row['Year_of_Manufacturing'] else 0
                    },
                    "status": {
                        "mileage": int(row['Mileage']) if row['Mileage'] else 0,
                        "price": float(row['Price']) if row['Price'] else 0.0
                    },
                    "dealer_id": current_dealer_id, # Reference to Dealer
                    "features": [],                 # Will append gradually
                    "service_history": [],          
                    "accident_history": [],         
                    
                    # These sets are used to check duplicates while iterating through rows
                    "_seen_features": set(),
                    "_seen_services": set(),
                    "_seen_accidents": set()
                }

            # Get current Car object for processing
            car_obj = cars_data[car_id]

            # C. GROUP FEATURES (Avoid duplicates)
            feature_val = row['Features']
            if feature_val and feature_val not in car_obj["_seen_features"]:
                car_obj["features"].append(feature_val)
                car_obj["_seen_features"].add(feature_val)

            # D. GROUP SERVICES (Avoid duplicates by ServiceID) 
            svc_id = row.get('ServiceID')
            if svc_id and svc_id not in car_obj["_seen_services"]:
                car_obj["service_history"].append({
                    "service_id": svc_id,
                    "date": parse_date(row['Date_of_Service']),
                    "type": row['ServiceType'],
                    "cost": float(row['Cost_of_Service']) if row['Cost_of_Service'] else 0.0
                })
                car_obj["_seen_services"].add(svc_id)

            # E. GROUP ACCIDENTS (Avoid duplicates by AccidentID)
            acc_id = row.get('AccidentID')
            if acc_id and acc_id not in car_obj["_seen_accidents"]:
                car_obj["accident_history"].append({
                    "accident_id": acc_id,
                    "date": parse_date(row['Date_of_Accident']),
                    "description": row['Description'],
                    "severity": row['Severity'],
                    "cost_of_repair": float(row['Cost_of_Repair']) if row['Cost_of_Repair'] else 0.0
                })
                car_obj["_seen_accidents"].add(acc_id)

    # 3. CLEAN UP TEMP DATA 
    print(" Cleaning up temporary data...")
    final_car_list = []
    for car in cars_data.values():
        car['features'].sort()
        # Remove temporary _seen_* fields
        clean_car = {k: v for k, v in car.items() if not k.startswith('_seen')}
        final_car_list.append(clean_car)

    # 4. WRITE JSON FILES
    print(f" Writing file {DEALER_OUTPUT}...")
    with open(DEALER_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(dealers_list, f, indent=2, ensure_ascii=False)

    print(f" Writing file {CAR_OUTPUT}...")
    with open(CAR_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(final_car_list, f, indent=2, ensure_ascii=False)

    print(f" Success! Created:")
    print(f"   - {len(dealers_list)} dealers")
    print(f"   - {len(final_car_list)} cars")

if __name__ == "__main__":
    convert_csv_to_json_pure_python()