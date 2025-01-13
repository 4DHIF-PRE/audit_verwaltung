import mysql, { PoolOptions } from "mysql2/promise";
import {
  ComparePasswords,
  GenerateSessionId,
  GenerateUserId,
  HashWithSalt,
} from "./util/crypt.util.js";
import { DateToSqlString, SqlDateTimeToDate } from "./util/general.util.js";
import { UserDataAdminView, UserDataFrontend } from "./util/types.util.js";
import {
  validateName,
  validateEmail,
  validatePassword,
} from "./util/validation.util.js";

const access: PoolOptions = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: parseInt(process.env.MYSQL_PORT),
  timezone: "Z", // required to prevent conversion to local time when querying from db
};

const connectionPool = mysql.createPool(access);

export async function login(
  email: string,
  password: string
): Promise<{ sessionId: string; expiresAt: Date } | Error> {
  if (!email) return new Error("Email must not be null/undefined/empty");
  if (!password) return new Error("Password must not be null/undefined/empty");

  const connection = await connectionPool.getConnection();
  try {
    await connection.beginTransaction();

    const [results, fields]: [any, mysql.FieldPacket[]] =
      await connection.execute(
        "SELECT `u_userId`, `u_salt`, `u_passwordHash`, `u_deletedAt` FROM `u_user` WHERE `u_email` = ?",
        [email]
      );

    if (results.length === 0) {
      return new Error("User with the provided email was not found");
    }

    const queryUser: any = results[0];

    if (queryUser.u_deletedAt) {
      return new Error("User was deleted");
    }

    const isPasswordMatching = await ComparePasswords(
      password,
      queryUser.u_salt,
      queryUser.u_passwordHash
    );
    if (!isPasswordMatching) {
      return new Error("Password does not match");
    }

    const [resultsDelete, fieldsDelete] = await connection.execute(
      "DELETE FROM `us_usersession` WHERE `us_u_userId` = ?",
      [queryUser.u_userId]
    );

    const timeNow = new Date(Date.now());
    timeNow.setUTCHours(timeNow.getUTCHours() + 1);
    console.log(`saving to db: ${timeNow}`);
    const sessionId = GenerateSessionId();
    const [resultsInsert, fieldsInsert] = await connection.execute(
      "INSERT INTO `us_usersession` (us_u_userId, us_sessionId, us_expiresAt) VALUES (?, ?, ?)",
      [queryUser.u_userId, sessionId, DateToSqlString(timeNow)]
    );

    await connection.commit();
    return {
      sessionId,
      expiresAt: timeNow,
    };
  } catch (error) {
    console.log(error);
    await connection.rollback();
    return error;
  } finally {
    connection.release();
  }
}

export async function SessionToUser(
  sessionId: string
): Promise<UserDataFrontend | Error> {
  if (!sessionId)
    return new Error("SessionId must not be null/undefined/empty");

  const connection = await connectionPool.getConnection();

  try {
    await connection.beginTransaction();

    const [results, fields]: [any, mysql.FieldPacket[]] =
      await connection.execute(
        "SELECT `u_userId`, `u_firstname`, `u_lastname`, `u_email`, `u_deletedAt`, `us_expiresAt` FROM `view_u_user_frontend` inner join `us_usersession` on us_u_userId = u_userId WHERE `us_sessionId` = ?",
        [sessionId]
      );
    if (results.length === 0) {
      return new Error("User with the provided sessionId was not found");
    }
    const queryUser: any = results[0];

    if (queryUser.u_deletedAt) {
      return new Error("User was deleted");
    }

    const timeNow = new Date(Date.now());

    if (timeNow.getTime() >= queryUser.us_expiresAt.getTime()) {
      return new Error("The provided sessionId has expired");
    }

    const [resultsRoles, fieldsRoles]: [any[], mysql.FieldPacket[]] =
      await connection.execute(
        "SELECT `r_id`, `r_rolename` FROM `ru_rolesuser` inner join `r_roles` on r_id = ru_r_id WHERE `ru_u_userId` = ?",
        [queryUser.u_userId]
      );

    const userData: UserDataFrontend = {
      u_firstname: queryUser.u_firstname,
      u_lastname: queryUser.u_lastname,
      u_email: queryUser.u_email,
      u_createdAt: queryUser.u_createdAt,
      roles: resultsRoles,
    };

    await connection.commit();
    return userData;
  } catch (error) {
    console.log(error);
    await connection.rollback();
    return error;
  } finally {
    connection.release();
  }
}

export async function GetAllUsersAdminView(
  sessionId: string
): Promise<UserDataAdminView[] | Error> {
  if (!sessionId)
    return new Error("SessionId must not be null/undefined/empty");

  const connection = await connectionPool.getConnection();

  try {
    await connection.beginTransaction();

    const [results, fields]: [any, mysql.FieldPacket[]] =
      await connection.execute(
        "SELECT `u_userId`, `u_deletedAt`, `us_expiresAt` FROM `view_u_user_frontend` inner join `us_usersession` on us_u_userId = u_userId WHERE `us_sessionId` = ?",
        [sessionId]
      );
    if (results.length === 0) {
      return new Error(
        "User with the provided sessionId was not found" + sessionId
      );
    }
    const queryUser: any = results[0];

    if (queryUser.u_deletedAt) {
      return new Error("User was deleted");
    }

    const timeNow = new Date(Date.now());

    if (timeNow.getTime() >= queryUser.us_expiresAt.getTime()) {
      return new Error("The provided sessionId has expired");
    }

    const [resultsRoles, fieldsRoles]: [any[], mysql.FieldPacket[]] =
      await connection.execute(
        "SELECT `r_id`, `r_rolename` FROM `ru_rolesuser` inner join `r_roles` on r_id = ru_r_id WHERE `ru_u_userId` = ?",
        [queryUser.u_userId]
      );

    const isAdmin = resultsRoles.some((e, index) => {
      if (e.r_id === 1) {
        return true;
      }

      return false;
    });

    if (!isAdmin) {
      return new Error("Unauthorized");
    }

    const [resultsAllUsers, fieldsAllUsers]: [any, mysql.FieldPacket[]] =
      await connection.execute(
        "SELECT `u_userId`, `u_firstname`, `u_lastname`, `u_email`, `u_deletedAt`, `u_createdAt` FROM `u_user` WHERE `u_userId` != ?",
        [queryUser.u_userId]
      );

    await connection.commit();
    return resultsAllUsers;
  } catch (error) {
    console.log(error);
    await connection.rollback();
    return error;
  } finally {
    connection.release();
  }
}

export async function DeleteOrRestoreUser(
  sessionId: string,
  userId_toDeleteOrRestore: string,
  isDeletion: boolean
): Promise<{ message: string } | Error> {
  if (!sessionId)
    return new Error("SessionId must not be null/undefined/empty");
  if (!userId_toDeleteOrRestore)
    return new Error(
      "userId of User to be deleted must not be null/undefined/empty"
    );

  const connection = await connectionPool.getConnection();

  try {
    await connection.beginTransaction();

    const [results, fields]: [any, mysql.FieldPacket[]] =
      await connection.execute(
        "SELECT `u_userId`, `u_deletedAt`, `us_expiresAt` FROM `view_u_user_frontend` inner join `us_usersession` on us_u_userId = u_userId WHERE `us_sessionId` = ?",
        [sessionId]
      );
    if (results.length === 0) {
      return new Error("User with the provided sessionId was not found");
    }
    const queryUser: any = results[0];

    if (queryUser.u_deletedAt) {
      return new Error("User was deleted");
    }

    const timeNow = new Date(Date.now());

    if (timeNow.getTime() >= queryUser.us_expiresAt.getTime()) {
      return new Error("The provided sessionId has expired");
    }

    const [resultsRoles, fieldsRoles]: [any[], mysql.FieldPacket[]] =
      await connection.execute(
        "SELECT `r_id`, `r_rolename` FROM `ru_rolesuser` inner join `r_roles` on r_id = ru_r_id WHERE `ru_u_userId` = ?",
        [queryUser.u_userId]
      );

    const isAdmin = resultsRoles.some((e, index) => {
      if (e.r_id === 1) {
        return true;
      }

      return false;
    });

    if (!isAdmin) {
      return new Error("Unauthorized");
    }

    if (isDeletion) {
      const [resultsRolesDeleted, fieldsRolesDeleted]: [
        any[],
        mysql.FieldPacket[]
      ] = await connection.execute(
        "SELECT `r_id`, `r_rolename` FROM `ru_rolesuser` inner join `r_roles` on r_id = ru_r_id WHERE `ru_u_userId` = ?",
        [userId_toDeleteOrRestore]
      );

      const isAdmin_UserTBDeleted = resultsRolesDeleted.some((e, index) => {
        if (e.r_id === 1) {
          return true;
        }

        return false;
      });

      if (isAdmin_UserTBDeleted) {
        return new Error("Can not delete an Admin");
      }
    }

    const [resultsDelete, fieldsDelete]: [any, mysql.FieldPacket[]] =
      await connection.execute(
        "UPDATE `u_user` SET `u_deletedAt` = ? WHERE `u_userId` = ?",
        [isDeletion ? DateToSqlString(timeNow) : null, userId_toDeleteOrRestore]
      );

    console.log(resultsDelete);
    console.log(fieldsDelete);

    if (resultsDelete.affectedRows > 1)
      throw new Error("DB-Error: Update would have affected more than 1 row.");

    await connection.commit();
    return { message: resultsDelete.info };
  } catch (error) {
    console.log(error);
    await connection.rollback();
    return error;
  } finally {
    connection.release();
  }
}

export async function CreateRegistrationToken(
  sessionId: string,
  firstname: string,
  lastname: string,
  email: string
): Promise<{ registrationToken: string } | Error> {
  if (!sessionId)
    return new Error("SessionId must not be null/undefined/empty");

  const errors = {
    firstname: validateName(firstname),
    lastname: validateName(lastname),
    email: validateEmail(email),
  };

  if (Object.values(errors).some(Boolean)) {
    return new Error(JSON.stringify(errors));
  }

  const connection = await connectionPool.getConnection();

  try {
    await connection.beginTransaction();

    const [results, fields]: [any, mysql.FieldPacket[]] =
      await connection.execute(
        "SELECT `u_userId`, `u_deletedAt`, `us_expiresAt` FROM `view_u_user_frontend` inner join `us_usersession` on us_u_userId = u_userId WHERE `us_sessionId` = ?",
        [sessionId]
      );
    if (results.length === 0) {
      return new Error("User with the provided sessionId was not found");
    }
    const queryUser: any = results[0];

    if (queryUser.u_deletedAt) {
      return new Error("User was deleted");
    }

    const timeNow = new Date(Date.now());

    if (timeNow.getTime() >= queryUser.us_expiresAt.getTime()) {
      return new Error("The provided sessionId has expired");
    }

    const [resultsRoles, fieldsRoles]: [any[], mysql.FieldPacket[]] =
      await connection.execute(
        "SELECT `r_id`, `r_rolename` FROM `ru_rolesuser` inner join `r_roles` on r_id = ru_r_id WHERE `ru_u_userId` = ?",
        [queryUser.u_userId]
      );

    const isAdmin = resultsRoles.some((e, index) => {
      if (e.r_id === 1) {
        return true;
      }

      return false;
    });

    if (!isAdmin) {
      return new Error("Unauthorized");
    }

    const [resultsEmailExists, fieldsEmailExists]: [
      any[],
      mysql.FieldPacket[]
    ] = await connection.execute(
      "SELECT `u_userId` FROM `view_u_user_frontend` WHERE `u_email` = ?",
      [email]
    );

    if (resultsEmailExists.length !== 0) {
      return new Error("A user with the provided email does already exist.");
    }

    timeNow.setUTCHours(timeNow.getUTCHours() + 2);

    const token = GenerateSessionId();

    const [resultsInsert, fieldsInsert]: [any, mysql.FieldPacket[]] =
      await connection.execute(
        "INSERT INTO `rp_registration_process` (rp_u_userId, rp_registrationId, rp_expiresAt, rp_firstname, rp_lastname, rp_email) VALUES (?, ?, ?, ?, ?, ?)",
        [
          queryUser.u_userId,
          token,
          DateToSqlString(timeNow),
          firstname,
          lastname,
          email,
        ]
      );

    console.log(resultsInsert);
    console.log(fieldsInsert);

    await connection.commit();
    return { registrationToken: token };
  } catch (error) {
    console.log(error);
    await connection.rollback();
    return error;
  } finally {
    connection.release();
  }
}

export async function GetAllRegistrationTokens(
  sessionId: string
): Promise<{} | Error> {
  if (!sessionId)
    return new Error("SessionId must not be null/undefined/empty");

  const connection = await connectionPool.getConnection();

  try {
    await connection.beginTransaction();

    const [results, fields]: [any, mysql.FieldPacket[]] =
      await connection.execute(
        "SELECT `u_userId`, `u_deletedAt`, `us_expiresAt` FROM `view_u_user_frontend` inner join `us_usersession` on us_u_userId = u_userId WHERE `us_sessionId` = ?",
        [sessionId]
      );
    if (results.length === 0) {
      return new Error("User with the provided sessionId was not found");
    }
    const queryUser: any = results[0];

    if (queryUser.u_deletedAt) {
      return new Error("User was deleted");
    }

    const timeNow = new Date(Date.now());

    if (timeNow.getTime() >= queryUser.us_expiresAt.getTime()) {
      return new Error("The provided sessionId has expired");
    }

    const [resultsTokens, fieldsTokens]: [any[], mysql.FieldPacket[]] =
      await connection.execute(
        "SELECT `rp_registrationId`, `rp_expiresAt`, `rp_firstname`, `rp_lastname`, `rp_email` FROM `rp_registration_process` WHERE `rp_u_userId` = ?",
        [queryUser.u_userId]
      );

    console.log(resultsTokens);
    console.log(fieldsTokens);

    await connection.commit();
    return resultsTokens;
  } catch (error) {
    console.log(error);
    await connection.rollback();
    return error;
  } finally {
    connection.release();
  }
}

export async function DeleteRegistrationTokens(
  sessionId: string,
  token: string | null
): Promise<{} | Error> {
  if (!sessionId)
    return new Error("SessionId must not be null/undefined/empty");

  const connection = await connectionPool.getConnection();

  try {
    await connection.beginTransaction();

    const [results, fields]: [any, mysql.FieldPacket[]] =
      await connection.execute(
        "SELECT `u_userId`, `u_deletedAt`, `us_expiresAt` FROM `view_u_user_frontend` inner join `us_usersession` on us_u_userId = u_userId WHERE `us_sessionId` = ?",
        [sessionId]
      );
    if (results.length === 0) {
      return new Error("User with the provided sessionId was not found");
    }
    const queryUser: any = results[0];

    if (queryUser.u_deletedAt) {
      return new Error("User was deleted");
    }

    const timeNow = new Date(Date.now());

    if (timeNow.getTime() >= queryUser.us_expiresAt.getTime()) {
      return new Error("The provided sessionId has expired");
    }

    const deletionQuery =
      token === null
        ? "DELETE FROM `rp_registration_process` WHERE `rp_u_userId` = ?"
        : "DELETE FROM `rp_registration_process` WHERE `rp_u_userId` = ? AND `rp_registrationId` = ?";
    const deletionValues =
      token === null ? [queryUser.u_userId] : [queryUser.u_userId, token];

    const [resultsTokens, fieldsTokens]: [any[], mysql.FieldPacket[]] =
      await connection.execute(deletionQuery, deletionValues);

    console.log(resultsTokens);
    console.log(fieldsTokens);

    await connection.commit();
    return resultsTokens;
  } catch (error) {
    console.log(error);
    await connection.rollback();
    return error;
  } finally {
    connection.release();
  }
}

export async function Register(
  registrationToken: string,
  inputPassword: string
): Promise<{ sessionToken: string; message: string } | Error> {
  if (!registrationToken)
    return new Error("SessionId must not be null/undefined/empty");

  const passwordValidationResult = validatePassword(inputPassword);

  if (passwordValidationResult) return new Error(passwordValidationResult);

  const connection = await connectionPool.getConnection();

  try {
    await connection.beginTransaction();

    const [resultsQueryToken, fields]: [any, mysql.FieldPacket[]] =
      await connection.execute(
        "SELECT `rp_u_userId`, `rp_registrationId`, `rp_expiresAt`, `rp_firstname`, `rp_lastname`, `rp_email` FROM `rp_registration_process` WHERE `rp_registrationId` = ?",
        [registrationToken]
      );
    if (resultsQueryToken.length === 0) {
      return new Error("Registration-Token was not found");
    }

    const registrationQuery: any = resultsQueryToken[0];

    const timeNow = new Date(Date.now());

    if (timeNow.getTime() >= registrationQuery.rp_expiresAt.getTime()) {
      const [resultDeleteToken, fieldsDeleteToken]: [any, mysql.FieldPacket[]] =
        await connection.execute(
          "DELETE FROM `rp_registration_process` WHERE `rp_registrationId` = ?",
          [registrationToken]
        );
      return new Error("The provided registrationToken has expired");
    }

    const generatedUserId = await GenerateUserId();
    const hashingResult = await HashWithSalt(inputPassword);

    if (hashingResult.error) {
      return new Error("An error occurred during hashing", hashingResult.error);
    }

    const [resultsInsert, fieldsInsert]: [any, mysql.FieldPacket[]] =
      await connection.execute(
        "INSERT INTO `u_user` (u_userId, u_firstname, u_lastname, u_email, u_deletedAt, u_createdAt, u_salt, u_passwordHash) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          generatedUserId,
          registrationQuery.rp_firstname,
          registrationQuery.rp_lastname,
          registrationQuery.rp_email,
          null,
          DateToSqlString(timeNow),
          hashingResult.salt,
          hashingResult.hash,
        ]
      );

    const [resultDeleteToken, fieldsDeleteToken]: [any, mysql.FieldPacket[]] =
      await connection.execute(
        "DELETE FROM `rp_registration_process` WHERE `rp_registrationId` = ?",
        [registrationToken]
      );

    await connection.commit();

    const loginResult = await login(registrationQuery.rp_email, inputPassword);

    if (loginResult instanceof Error) {
      return new Error(
        "An error occurred during the registration process",
        loginResult
      );
    }
    return {
      sessionToken: loginResult.sessionId,
      message: "Registration was successful",
    };
  } catch (error) {
    console.log(error);
    await connection.rollback();
    return error;
  } finally {
    connection.release();
  }
}

export async function Logout(sessionId: string): Promise<{} | Error> {
  if (!sessionId)
    return new Error("SessionId must not be null/undefined/empty");

  const connection = await connectionPool.getConnection();

  try {
    await connection.beginTransaction();

    const [results, fields]: [any, mysql.FieldPacket[]] =
      await connection.execute(
        "DELETE FROM `us_usersession` WHERE `us_sessionId` = ?",
        [sessionId]
      );

    await connection.commit();
    return results;
  } catch (error) {
    console.log(error);
    await connection.rollback();
    return error;
  } finally {
    connection.release();
  }
}

export async function IsFirstRegistration(): Promise<boolean> {
  const connection = await connectionPool.getConnection();

  try {
    await connection.beginTransaction();

    let isFirstRegistration = false;

    const [resultQuery1, fieldsQuery1]: [any[], mysql.FieldPacket[]] =
      await connection.execute(
        "SELECT * FROM `ru_rolesuser` WHERE `ru_r_id` = 1",
        []
      );

    if (resultQuery1.length === 0) isFirstRegistration = true;
    /*
                const [resultQuery2, fieldsQuery2]: [any, mysql.FieldPacket[]] = await connection.execute(
                    'SELECT COUNT(u_userId) FROM `u_user`',
                    []
                );
        
                console.log(resultQuery2);
        */

    await connection.commit();
    return isFirstRegistration;
  } catch (error) {
    console.log(error);
    await connection.rollback();
    return false;
  } finally {
    connection.release();
  }
}

export async function GetAllFindings(): Promise<string | Error> {
  const connection = await connectionPool.getConnection();

  try {
    await connection.beginTransaction();

    const [results]: [any, mysql.FieldPacket[]] = await connection.execute(
      "SELECT * FROM f_findings"
    );
    if (results.length === 0) {
      return new Error("No Findings");
    }

    await connection.commit();
    return results;
  } catch (error) {
    console.log(error);
    await connection.rollback();
    return error;
  } finally {
    connection.release();
  }
}

export async function RegisterFirstAdmin(
  userData: {
    u_firstname: string;
    u_lastname: string;
    u_email: string;
    inputPassword: string;
  } | null
): Promise<{ sessionToken: string; message: string } | Error> {
  if (!userData.u_firstname)
    return new Error("u_firstname must not be null/undefined/empty");
  if (!userData.u_lastname)
    return new Error("u_lastname must not be null/undefined/empty");
  if (!userData.u_email)
    return new Error("u_email must not be null/undefined/empty");
  if (!userData.inputPassword)
    return new Error("inputPassword must not be null/undefined/empty");

  const isFirstAdminResult = await IsFirstRegistration();

  if (!isFirstAdminResult) {
    return new Error("An admin already exists");
  }

  const connection = await connectionPool.getConnection();

  try {
    await connection.beginTransaction();

    const timeNow = new Date(Date.now());
    const generatedUserId = await GenerateUserId();
    const hashingResult = await HashWithSalt(userData.inputPassword);

    if (hashingResult.error) {
      return new Error("An error occurred during hashing", hashingResult.error);
    }

    const [resultsInsert, fieldsInsert]: [any, mysql.FieldPacket[]] =
      await connection.execute(
        "INSERT INTO `u_user` (u_userId, u_firstname, u_lastname, u_email, u_deletedAt, u_createdAt, u_salt, u_passwordHash) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          generatedUserId,
          userData.u_firstname,
          userData.u_lastname,
          userData.u_email,
          null,
          DateToSqlString(timeNow),
          hashingResult.salt,
          hashingResult.hash,
        ]
      );

    const [resultsInsertRole, fieldsInsertRole]: [any, mysql.FieldPacket[]] =
      await connection.execute(
        "INSERT INTO `ru_rolesuser` (ru_u_userId, ru_r_id) VALUES (?, ?)",
        [generatedUserId, 1 /*Admin-Role*/]
      );

    await connection.commit();

    const loginResult = await login(userData.u_email, userData.inputPassword);

    if (loginResult instanceof Error) {
      return new Error(
        "An error occurred during the registration process",
        loginResult
      );
    }
    return {
      sessionToken: loginResult.sessionId,
      message: "Registration of the first admin was successful",
    };
  } catch (error) {
    console.log(error);
    await connection.rollback();
    return error;
  } finally {
    connection.release();
  }
}

//gruppe 4

export async function getAuditQuestions(
  auditId: Number
): Promise<any[] | Error> {
  if (!auditId) return new Error("Audit ID must not be null or empty");

  const connection = await connectionPool.getConnection();
  try {
    const [results, fields]: [any[], mysql.FieldPacket[]] =
      await connection.execute(
        "SELECT * FROM qu_questions WHERE qu_audit_idx = ?",
        [auditId]
      );

    return results;
  } catch (error) {
    return new Error("Error executing query");
  } finally {
    connection.release();
  }
}

export async function createFinding(findingData: {
  f_level: Number;
  f_auditor_comment: string;
  f_finding_comment: string;
  f_creation_date: Date;
  f_timeInDays: number;
  f_status: string;
  f_au_audit_idx: number;
  f_qu_question_idx: number;
  f_u_auditor_id: number;
}): Promise<number | Error> {
  const connection = await connectionPool.getConnection();
  try {
    const [result]: any = await connection.execute(
      `INSERT INTO f_findings (f_level, f_auditor_comment, f_finding_comment, f_creation_date, f_timeInDays, f_status, f_au_audit_idx, f_qu_question_idx, f_u_auditor_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        findingData.f_level,
        findingData.f_auditor_comment,
        findingData.f_finding_comment,
        findingData.f_creation_date,
        findingData.f_timeInDays,
        findingData.f_status,
        findingData.f_au_audit_idx,
        findingData.f_qu_question_idx,
        findingData.f_u_auditor_id,
      ]
    );
    return result.insertId;
  } catch (error) {
    return new Error("Error inserting finding");
  } finally {
    connection.release();
  }
}

export async function updateFinding(updateData: {
  f_id: number;
  f_level: Number;
  f_auditor_comment: string;
  f_finding_comment: string;
  f_creation_date: Date;
  f_timeInDays: number;
  f_status: string;
}): Promise<void | Error> {
  const connection = await connectionPool.getConnection();
  try {
    // Date conversion of f_creation_date, as SQL query fails at date parsing otherwise
    const creationDate = new Date(updateData.f_creation_date)
      .toISOString()
      .split(".")[0]
      .replace("T", " ");

    // console.log("Update Data: ", updateData);
    const results = await connection.execute(
      `UPDATE f_findings
             SET f_level = ${updateData.f_level}, f_comment = '${updateData.f_auditor_comment}', f_finding_comment = '${updateData.f_finding_comment}', f_creation_date = '${creationDate}', f_timeInDays = ${updateData.f_timeInDays}, f_status = '${updateData.f_status}'
             WHERE f_id = ${updateData.f_id}`
    );
  } catch (error) {
    console.log(error);
    return new Error("Error updating finding");
  } finally {
    connection.release();
  }
}

export async function deleteFinding(findingId: number): Promise<void | Error> {
  const connection = await connectionPool.getConnection();
  try {
    const results = await connection.execute(
      `DELETE FROM f_findings WHERE tb_idx = ?`,
      [findingId]
    );
    console.log(results, findingId);
  } catch (error) {
    return new Error("Error deleting finding");
  } finally {
    connection.release();
  }
}

export async function getFindingsByID(auditId: number): Promise<any | Error> {
  const connection = await connectionPool.getConnection();
  try {
    const [result] = await connection.execute(
      `SELECT *
             FROM f_findings
             WHERE f_id = ?`,
      [auditId] // Correctly pass auditId as an array
    );

    return result;
  } catch (error) {
    console.error("Error executing query:", error);
    return new Error("Error fetching findings");
  } finally {
    connection.release(); // Ensure connection is released
  }
}

//get findings by id
export async function getFindingByQuestionID(
  questionId: number
): Promise<any | Error> {
  const connection = await connectionPool.getConnection();
  try {
    const [results] = await connection.execute(
      `SELECT *
             FROM f_findings
             WHERE f_qu_question_idx = ?
             LIMIT 1`, // Ensure it only fetches one result
      [questionId] // Bind the questionId
    );

    return results[0] || null; // Return the first (and only) result, or null if no result
  } catch (error) {
    console.error("Error fetching finding:", error);
    return new Error("Error fetching finding");
  } finally {
    connection.release(); // Ensure the connection is released
  }
}

export async function uploadAttachment(
  findingId: any,
  file: Buffer,
  fileName: string
): Promise<any | Error> {
  const connection = await connectionPool.getConnection();
  try {
    const [result]: any = await connection.execute(
      `INSERT INTO fa_findingattachments (fa_fid, fa_file, fa_filename)
             VALUES (?, ?, ?)`,
      [findingId, file, fileName]
    );
    return result.insertId;
  } catch (error) {
    console.error("Error inserting attachment:", error);
    return new Error("Error uploading attachment");
  } finally {
    connection.release();
  }
}

// get FILENAME by findinID
export async function getFileNameByFindingId(findingId) {
  if (!findingId) {
    return new Error("Finding ID must not be null or undefined.");
  }

  const connection = await connectionPool.getConnection();
  try {
    const [rows] = await connection.execute(
      "SELECT fa_filename, fa_id FROM fa_findingattachments WHERE fa_fid = ?",
      [findingId]
    );

    return rows;
  } catch (error) {
    console.error("Error retrieving filename:", error);
    return new Error("Error retrieving filename.");
  } finally {
    connection.release();
  }
}

//get Files
export async function getFilesByFindingId(findingId) {
  if (!findingId) {
    return new Error("Finding ID must not be null or undefined.");
  }

  const connection = await connectionPool.getConnection();
  try {
    const [rows] = await connection.execute(
      "SELECT fa_file, fa_filename, fa_id FROM fa_findingattachments WHERE fa_fid = ?",
      [findingId]
    );
    return rows;
  } catch (error) {
    console.error("Error retrieving filename:", error);
    return new Error("Error retrieving filename.");
  } finally {
    connection.release();
  }
}

//delete File
export async function deleteFileByFindingAttachmentId(findingAttachmentId) {
  if (!findingAttachmentId) {
    return new Error("Finding ID must not be null or undefined.");
  }

  const connection = await connectionPool.getConnection();
  try {
    const [rows] = await connection.execute(
      "DELETE from fa_findingattachments WHERE audit.fa_findingattachments.fa_id = ?",
      [findingAttachmentId]
    );

    return rows;
  } catch (error) {
    console.error("Error retrieving filename:", error);
    return new Error("Error retrieving filename.");
  } finally {
    connection.release();
  }
}

//get File
export async function getFileByFindingAttachmentId(attachmentId) {
  if (!attachmentId) {
    return new Error("Finding ID must not be null or undefined.");
  }

  const connection = await connectionPool.getConnection();
  try {
    const [rows] = await connection.execute(
      "SELECT fa_file, fa_filename FROM fa_findingattachments WHERE fa_id = ?",
      [attachmentId]
    );

    return rows;
  } catch (error) {
    console.error("Error retrieving filename:", error);
    return new Error("Error retrieving filename.");
  } finally {
    connection.release();
  }
}
// Gruppe3
// Law functions
export async function CreateLaw(lawData) {
  const query = `
        INSERT INTO la_law (la_law, la_typ, la_description, la_text, la_valid_from, la_valid_until)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
  const values = [
    lawData.la_law,
    lawData.la_typ,
    lawData.la_description,
    lawData.la_text || null,
    lawData.la_valid_from,
    lawData.la_valid_until,
  ];
  const pool = await connectionPool.getConnection();
  try {
    const [result] = await pool.execute(query, values);
    return result;
  } catch (error) {
    return new Error(`Failed to create law: ${error.message}`);
  } finally {
    pool.release();
  }
}

export async function GetAllLaws() {
  const query = `SELECT * FROM la_law`;
  const pool = await connectionPool.getConnection();
  try {
    const [rows] = await pool.execute(query);
    return rows;
  } catch (error) {
    return new Error(`Failed to retrieve laws: ${error.message}`);
  } finally {
    pool.release();
  }
}

export async function GetLawById(lawId) {
  const query = `SELECT * FROM la_law WHERE la_idx = ?`;
  const pool = await connectionPool.getConnection();
  try {
    const [rows] = await pool.execute(query, [lawId]);
    return rows[0] || null;
  } catch (error) {
    return new Error(`Failed to retrieve law: ${error.message}`);
  } finally {
    pool.release();
  }
}

export async function UpdateLaw(lawId, updates) {
  const fields = Object.keys(updates)
    .map((key) => `${key} = ?`)
    .join(", ");
  const values = Object.values(updates).concat(lawId.toString()).join(", ");
  const query = `UPDATE la_law SET ${fields} WHERE la_idx = ?`;
  const pool = await connectionPool.getConnection();
  try {
    const [result] = await pool.execute(query, values);
    return result;
  } catch (error) {
    return new Error(`Failed to update law: ${error.message}`);
  } finally {
    pool.release();
  }
}

export async function DeleteLaw(lawId) {
  const pool = await connectionPool.getConnection();
  try {
    const [result]: [mysql.ResultSetHeader, mysql.FieldPacket[]] =
      await pool.query("DELETE FROM `la_law` WHERE `la_idx` = ?", [lawId]);
    if (result[0].affectedRows === 0) {
      return new Error("Law not found or already deleted");
    }
  } catch (error) {
    console.error("Error deleting law:", error);
    return new Error("Database error occurred while deleting law");
  } finally {
    pool.release();
  }
}

// Audit functions
export async function CreateAudit(auditData) {
  const pool = await connectionPool.getConnection();
  const query = `
        INSERT INTO au_audit (au_audit_date, au_number_of_days, au_leadauditor_idx, au_leadauditee_idx, au_auditstatus, au_place, au_theme, au_typ)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
  const values = [
    auditData.au_audit_date,
    auditData.au_number_of_days,
    auditData.au_leadauditor_idx,
    auditData.au_leadauditee_idx,
    auditData.au_auditstatus,
    auditData.au_place,
    auditData.au_theme,
    auditData.au_typ,
  ];
  try {
    const [result] = await pool.execute(query, values);
    return result;
  } catch (error) {
    return new Error(`Failed to create audit: ${error.message}`);
  } finally {
    pool.release();
  }
}

export async function GetAllAudits() {
  const query = `SELECT * FROM au_audit`;
  const pool = await connectionPool.getConnection();
  try {
    const [rows] = await pool.execute(query);
    return rows;
  } catch (error) {
    return new Error(`Failed to retrieve audits: ${error.message}`);
  } finally {
    pool.release();
  }
}

export async function GetAuditById(auditId) {
  const query = `SELECT * FROM au_audit WHERE au_idx = ?`;
  const pool = await connectionPool.getConnection();
  try {
    const [rows] = await pool.execute(query, [auditId]);
    return rows[0] || null;
  } catch (error) {
    return new Error(`Failed to retrieve audit: ${error.message}`);
  } finally {
    pool.release();
  }
}

export async function UpdateAudit(auditId, updates) {
  const fields = Object.keys(updates)
    .map((key) => `${key} = ?`)
    .join(", ");
  const values = Object.values(updates).concat(auditId);
  const query = `UPDATE au_audit SET ${fields} WHERE au_idx = ?`;
  const pool = await connectionPool.getConnection();
  try {
    const [result] = await pool.execute(query, values);
    return result;
  } catch (error) {
    return new Error(`Failed to update audit: ${error.message}`);
  } finally {
    pool.release();
  }
}

export async function DeleteAudit(auditId) {
  const pool = await connectionPool.getConnection();
  try {
    await pool.beginTransaction();

    await pool.execute(
      `
            DELETE f 
            FROM f_findings f
            JOIN qu_questions q ON f.f_qu_question_idx = q.qu_idx
            WHERE q.qu_audit_idx = ?`,
      [auditId]
    );

    await pool.execute("DELETE FROM qu_questions WHERE qu_audit_idx = ?", [
      auditId,
    ]);

    const [result] = await pool.execute(
      "DELETE FROM au_audit WHERE au_idx = ?",
      [auditId]
    );

    // @ts-ignore
    if (result.affectedRows === 0) {
      await pool.rollback();
      return new Error("Audit not found or already deleted");
    }

    await pool.commit();
  } catch (error) {
    await pool.rollback();
    console.error("Error deleting audit:", error);
    return new Error("Database error occurred while deleting audit");
  } finally {
    pool.release();
  }
}

export async function UpdateAuditStatus(auditId, newStatus) {
  const query = `UPDATE au_audit SET au_auditstatus = ? WHERE au_idx = ?`;
  const pool = await connectionPool.getConnection();
  try {
    const [result] = await pool.execute(query, [newStatus, auditId]);
    //@ts-ignore
    if (result.affectedRows === 0) {
      return new Error("Audit not found");
    }
    return result;
  } catch (error) {
    return new Error(`Failed to update audit status: ${error.message}`);
  } finally {
    pool.release();
  }
}

// Question functions
export async function CreateQuestion(questionData) {
  const query = `
        INSERT INTO qu_questions (qu_audit_idx, qu_law_idx, qu_audited, qu_applicable, qu_finding_level)
        VALUES (?, ?, ?, ?, ?)
    `;
  const values = [
    questionData.qu_audit_idx,
    questionData.qu_law_idx,
    questionData.qu_audited,
    questionData.qu_applicable,
    questionData.qu_finding_level || null,
  ];
  const pool = await connectionPool.getConnection();
  try {
    const [result] = await pool.execute(query, values);
    return result;
  } catch (error) {
    return new Error(`Failed to create question: ${error.message}`);
  } finally {
    pool.release();
  }
}

export async function GetAllQuestions() {
  const query = `SELECT * FROM qu_questions`;
  const pool = await connectionPool.getConnection();
  try {
    const [rows] = await pool.execute(query);
    return rows;
  } catch (error) {
    return new Error(`Failed to retrieve questions: ${error.message}`);
  } finally {
    pool.release();
  }
}

export async function GetQuestionById(questionId) {
  const query = `SELECT * FROM qu_questions WHERE qu_idx = ?`;
  const pool = await connectionPool.getConnection();
  try {
    const [rows] = await pool.execute(query, [questionId]);
    return rows[0] || null;
  } catch (error) {
    return new Error(`Failed to retrieve question: ${error.message}`);
  } finally {
    pool.release();
  }
<<<<<<< HEAD
}

export async function GetFindingWorkOnById(findingWorkOnId) {
    const query = `SELECT * FROM fw_finding_workon WHERE fw_finding_idx = ?`;
    const pool = await connectionPool.getConnection();
    try {
        const [rows] = await pool.execute(query, [findingWorkOnId]);
        return rows[0] || null;
    } catch (error) {
        return new Error(`Failed to retrieve question: ${error.message}`);
    }
=======
>>>>>>> 910928749d229356669f77c39f150a9fa0289599
}

export async function UpdateQuestion(questionId, updates) {
  const fields = Object.keys(updates)
    .map((key) => `${key} = ?`)
    .join(", ");
  const values = Object.values(updates).concat(questionId);
  const query = `UPDATE qu_questions SET ${fields} WHERE qu_idx = ?`;
  const pool = await connectionPool.getConnection();
  try {
    const [result] = await pool.execute(query, values);
    return result;
  } catch (error) {
    return new Error(`Failed to update question: ${error.message}`);
  } finally {
    pool.release();
  }
}

export async function DeleteQuestion(questionId) {
  const pool = await connectionPool.getConnection();
  try {
    await pool.beginTransaction();

    // Delete all findings related to the question
    await pool.execute("DELETE FROM f_findings WHERE f_qu_question_idx = ?", [
      questionId,
    ]);

    // Delete the question
    const [result] = await pool.execute(
      "DELETE FROM qu_questions WHERE qu_idx = ?",
      [questionId]
    );

    // @ts-ignore
    if (result.affectedRows === 0) {
      await pool.rollback();
      return new Error("Question not found or already deleted");
    }

    await pool.commit();
  } catch (error) {
    await pool.rollback();
    console.error("Error deleting question and findings:", error);
    return new Error("Database error occurred while deleting question");
  } finally {
    pool.release();
  }
}

export async function GetQuestionByAuditAndLaw(auditId, lawId) {
  const query = `
      SELECT * FROM qu_questions 
      WHERE qu_audit_idx = ? AND qu_law_idx = ?
    `;
  const pool = await connectionPool.getConnection();
  try {
    const [rows] = await pool.execute(query, [auditId, lawId]);
    return rows[0] || null;
  } catch (error) {
    return new Error(`Failed to check question existence: ${error.message}`);
  } finally {
    pool.release();
  }
}
