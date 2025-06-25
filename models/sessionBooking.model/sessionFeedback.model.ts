SessionFeedback.init({
  menteeRating: DataTypes.INTEGER,
  menteeComment: DataTypes.TEXT,
  mentorComment: DataTypes.TEXT,
}, { sequelize, modelName: 'SessionFeedback' });

SessionFeedback.belongsTo(SessionBooking);
SessionBooking.hasOne(SessionFeedback);
