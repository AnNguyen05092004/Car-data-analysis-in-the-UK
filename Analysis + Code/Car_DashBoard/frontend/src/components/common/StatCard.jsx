// StatCard Component
export const StatCard = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600'
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} p-6 rounded-lg shadow-lg text-white`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-90 mb-1">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className="text-5xl opacity-80">
          {typeof icon === 'string' && (icon.startsWith('/') || icon.startsWith('http')) ? (
            <img src={icon} alt={title} className="w-12 h-12 object-contain" />
          ) : (
            icon
          )}
        </div>
      </div>
    </div>
  );
};