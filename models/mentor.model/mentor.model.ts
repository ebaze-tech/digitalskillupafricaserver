import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../../config/db.config";

export interface MentorAttributes {
  mentorId: number | string;
  userId: number;
  shortBio: string;
  goals: string;
  username: string;
}

type MentorInstance = Optional<MentorAttributes, "mentorId">;

export class Mentor
  extends Model<MentorAttributes, MentorInstance>
  implements MentorAttributes
{
  public mentorId!: number;
  public username!: string;
  public userId!: number;
  public shortBio!: string;
  public goals!: string;
}

Mentor.init(
  {
    mentorId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "Mentor",
    modelName: "Mentorship Request",
    freezeTableName: true,
    timestamps: true,
  }
);

export default Mentor;
