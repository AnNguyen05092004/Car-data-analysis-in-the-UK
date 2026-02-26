
// ===== CAR DETAIL MODAL =====
const CarDetailModal = ({ car, onClose }) => {
  if (!car) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[110vh] flex flex-col mt-12">
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        {/* Header */}
        <div className=" bg-gradient-to-r from-blue-500 to-blue-700 text-white p-6 rounded-t-lg">

          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">{car.manufacturer} {car.model}</h2>
              <p className="text-blue-100 text-sm mt-1">Car ID: {car._id}</p>
            </div>
            <button onClick={onClose} className="text-white hover:text-gray-200 text-3xl font-bold">
              ×
            </button>
          </div>
        </div>
     
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
          {/* Basic Information */}
          {/* <h2 className="text-gray-600"><bl>Car ID: {car._id}</bl></h2> */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2"> Basic Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Manufacturer:</span>
                  <span className="font-semibold text-gray-900">{car.manufacturer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Model:</span>
                  <span className="font-semibold text-gray-900">{car.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Year:</span>
                  <span className="font-semibold text-gray-900">{car.specifications.year_of_manufacturing}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dealer ID:</span>
                  <span className="font-semibold text-gray-900">{car.dealer_id}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2"> Specifications</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Engine Size:</span>
                  <span className="font-semibold text-gray-900">{car.specifications.engine_size}L</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fuel Type:</span>
                  <span className="font-semibold text-gray-900">{car.specifications.fuel_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mileage:</span>
                  <span className="font-semibold text-gray-900">{car.status.mileage.toLocaleString()} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-bold text-green-600 text-lg">${car.status.price.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-blue-200 pb-2"> Features</h3>
            <div className="flex flex-wrap gap-2">
              {car.features && car.features.length > 0 ? (
                car.features.map((feature, idx) => (
                  <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {feature}
                  </span>
                ))
              ) : (
                <span className="text-gray-500">No features listed</span>
              )}
            </div>
          </div>

          {/* Service History */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-green-200 pb-2">
            Service History ({car.service_history?.length || 0})
            </h3>
            {car.service_history && car.service_history.length > 0 ? (
              <div className="overflow-x-auto max-h-60 overflow-y-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-green-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Type</th>
                      <th className="px-4 py-2 text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-green-100">
                    {car.service_history.map((service, idx) => (
                      <tr key={idx} className="hover:bg-green-50">
                        <td className="px-4 py-2">{new Date(service.date).toLocaleDateString()}</td>
                        <td className="px-4 py-2">{service.type}</td>
                        <td className="px-4 py-2 text-right font-semibold">${service.cost.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No service history</p>
            )}
          </div>

          {/* Accident History */}
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-red-200 pb-2">
             Accident History ({car.accident_history?.length || 0})
            </h3>
            {car.accident_history && car.accident_history.length > 0 ? (
              <div className="overflow-x-auto max-h-60 overflow-y-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-red-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Severity</th>
                      <th className="px-4 py-2 text-left">Description</th>
                      <th className="px-4 py-2 text-right">Repair Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-100">
                    {car.accident_history.map((accident, idx) => (
                      <tr key={idx} className="hover:bg-red-50">
                        <td className="px-4 py-2">{new Date(accident.date).toLocaleDateString()}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            accident.severity === 'Major' ? 'bg-red-200 text-red-800' :
                            accident.severity === 'Moderate' ? 'bg-orange-200 text-orange-800' :
                            'bg-yellow-200 text-yellow-800'
                          }`}>
                            {accident.severity}
                          </span>
                        </td>
                        <td className="px-4 py-2">{accident.description}</td>
                        <td className="px-4 py-2 text-right font-semibold text-red-600">
                          ${accident.cost_of_repair.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No accident history</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 p-4 rounded-b-lg flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
export default CarDetailModal;