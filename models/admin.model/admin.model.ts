import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../../config/db.config";

export interface AdminAttributes {
  adminId: number | string;
  userId: number;
  shortBio: string;
  goals: string;
}

type AdminInstance = Optional<AdminAttributes, "adminId">;

class Admin
  extends Model<AdminAttributes, AdminInstance>
  implements AdminAttributes
{
  public adminId!: number;
  public userId!: number;
  public shortBio!: string;
  public goals!: string;
}

Admin.init(
  {
    adminId: {
      type: DataTypes.UUID,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    shortBio: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    goals: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "Admin",
    modelName: "Mentorship Request",
    timestamps: true,
  }
);

export default Admin;
