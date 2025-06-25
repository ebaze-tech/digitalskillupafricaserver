import { Model, DataTypes } from "sequelize";
import sequelize from "../../config/db.config";

export class Skill extends Model {
  public id!: number;
  public name!: string;
}

Skill.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Skill",
    tableName: "Skills",
    freezeTableName: true,
    timestamps: false,
  }
);
