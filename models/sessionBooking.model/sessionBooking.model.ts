SessionBooking.init({
  sessionDate: DataTypes.DATE,
}, { sequelize, modelName: 'SessionBooking' });

SessionBooking.belongsTo(BaseUser, { as: "mentor" });
SessionBooking.belongsTo(BaseUser, { as: "mentee" });
