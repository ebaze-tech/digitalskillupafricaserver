import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../../config/db.config";
import { Skill } from "../skill.model/skill.model";

export interface UserModel {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  role: "admin" | "mentor" | "mentee";
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserInstance extends Optional<UserModel, "id"> {}

export class User extends Model<UserModel, UserInstance> implements UserModel {
  public id!: number;
  public username!: string;
  public email!: string;
  public passwordHash!: string;
  public role!: "admin" | "mentor" | "mentee";

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public setSkills!: (skills: Skill[] | number[]) => Promise<void>;
  public getSkills!: () => Promise<Skill[]>;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    username: {
      type: new DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    email: {
      type: new DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    passwordHash: {
      type: new DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("admin", "mentor", "mentee"),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "Users",
    freezeTableName: true,
    timestamps: true,
  }
);

export default User;

