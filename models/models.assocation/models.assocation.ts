import { User } from "../user.model/user.model";
import Admin from "../admin.model/admin.model";
import Mentor from "../mentor.model/mentor.model";
import Mentee from "../mentee.model/mentee.model";
import { Skill } from "../skill.model/skill.model";
import { MentorshipRequest } from "../mentorship.model/mentorship.model";

export const modelAssociations = () => {
  // Admin <-> User
  User.hasOne(Admin, { foreignKey: "userId", as: "adminProfile" });
  Admin.belongsTo(User, { foreignKey: "userId" });

  // Mentor <-> User
  User.hasOne(Mentor, { foreignKey: "userId", as: "mentorProfile" });
  Mentor.belongsTo(User, { foreignKey: "userId" });

  // Mentee <-> User
  User.hasOne(Mentee, { foreignKey: "userId", as: "menteeProfile" });
  Mentee.belongsTo(User, { foreignKey: "userId" });

  // User <-> Skill (Many-to-Many)
  User.belongsToMany(Skill, { through: "User Skills", as: "Skills" });
  Skill.belongsToMany(User, { through: "User Skills", as: "Users" });

  MentorshipRequest.belongsTo(User, { as: "Mentor", foreignKey: "mentorId" });
  MentorshipRequest.belongsTo(User, { as: "Mentee", foreignKey: "menteeId" });

  User.hasMany(MentorshipRequest, {
    foreignKey: "mentorId",
    as: "incomingRequests",
  });
  User.hasMany(MentorshipRequest, {
    foreignKey: "menteeId",
    as: "sentRequests",
  });
};
