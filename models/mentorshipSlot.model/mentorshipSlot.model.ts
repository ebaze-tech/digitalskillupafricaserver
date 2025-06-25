AvailabilitySlot.init({
  day: DataTypes.STRING, // e.g., "Monday"
  startTime: DataTypes.TIME,
  endTime: DataTypes.TIME,
}, { sequelize, modelName: 'AvailabilitySlot' });

AvailabilitySlot.belongsTo(BaseUser, { as: "mentor" });
BaseUser.hasMany(AvailabilitySlot, { as: "availability", foreignKey: "mentorId" });
