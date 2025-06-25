import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../../config/db.config";

export interface MenteeAttributes {
  menteeId: number | string;
  userId: number;
  shortBio: string;
  goals: string;
  username: string;
}

type MenteeInstance = Optional<MenteeAttributes, "menteeId">;

class Mentee
  extends Model<MenteeAttributes, MenteeInstance>
  implements MenteeAttributes
{
  public menteeId!: number;
  public userId!: number;
  public shortBio!: string;
  public goals!: string;
  public username!: string;
}

Mentee.init(
  {
    menteeId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      // primaryKey: true,
    },

    shortBio: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    goals: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "Mentee",
    modelName: "Mentorship Request",
    freezeTableName: true,
    timestamps: true,
  }
);

export default Mentee;