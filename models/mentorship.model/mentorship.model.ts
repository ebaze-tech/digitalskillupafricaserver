import { Model, DataTypes } from "sequelize";
import sequelize from "../../config/db.config";

export enum RequestStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
}

export class MentorshipRequest extends Model {
  public id!: number;
  public mentorId!: string;
  public menteeId!: string;
  public status!: RequestStatus;
}

MentorshipRequest.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    menteeId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    mentorId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "accepted", "rejected"),
      defaultValue: "pending",
    },
  },
  {
    sequelize,
    modelName: "Mentorship Request",
    tableName: "Mentorship Request",
  }
);
