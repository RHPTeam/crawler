/* eslint-disable no-nested-ternary */
/* eslint-disable no-unused-expressions */
/* eslint-disable one-var */
/**
 * Controller users or account for project
 * author: hoc-anms
 * updater: sky albert
 * date up: 20/04/2019
 * date to: ___
 * team: BE-RHP
 */
const JWT = require( "jsonwebtoken" );
const nodemailer = require( "nodemailer" ),
  CronJob = require( "cron" ).CronJob;
const randomString = require( "randomstring" );
const dictionary = require( "../configs/dictionaries" );

const Account = require( "../models/Account.model" );
const Role = require( "../models/Role.model" );
const PostCategory = require( "../models/post/PostCategory.model" );

const jsonResponse = require( "../configs/response" );
const checkPhone = require( "../helpers/utils/functions/phone" );
const secure = require( "../helpers/utils/secures/jwt" );
const decodeRole = require( "../helpers/utils/secures/role" );
const convertUnicode = require( "../helpers/utils/functions/unicode" );
const arrayFunction = require( "../helpers/utils/functions/array" ),
  { update } = require( "../microservices/synchronize/account.service" ),
  // set one cookie
  option = {
    "maxAge": 1000 * 60 * 60 * 24, // would expire after 1 days
    "httpOnly": true, // The cookie only accessible by the web server
    "signed": true, // Indicates if the cookie should be signed
    "secure": true
  },
  signToken = ( user ) => {
    return JWT.sign(
      {
        "iss": "RHPTeam",
        "sub": user.email,
        "iat": new Date().getTime(), // current time
        "exp": new Date().setDate( new Date().getDate() + 1 ) // current time + 1 day ahead
      },
      process.env.APP_KEY
    );
  };

module.exports = {
  /**
   * Sign up function
   * @param req
   * @param res
   * @returns {Promise<*|Promise<any>>}
   */
  "signUp": async ( req, res ) => {
    const { email, phone } = req.value.body,
      isPhone = checkPhone( req.value.body.phone );

    if ( isPhone === false ) {
      return res
        .status( 403 )
        .json( jsonResponse( "Number phone is not correctly!", null ) );
    }
    const foundUserEmail = await Account.findOne( {
      email
    } );

    if ( foundUserEmail ) {
      return res.status( 404 ).json( jsonResponse( "Email is exists!", null ) );
    }
    const foundUserPhone = await Account.findOne( {
      phone
    } );

    if ( foundUserPhone ) {
      return res
        .status( 404 )
        .json( jsonResponse( "Number phone is exists!", null ) );
    }

    // Role for user
    let roleMember;
    let roleAdmin;
    let roleSuperAdmin;
    const foundRoleMember = await Role.findOne( { "level": "Member" } );
    const foundRoleAdmin = await Role.findOne( { "level": "Admin" } );
    const foundRoleSuperAdmin = await Role.findOne( { "level": "SuperAdmin" } );

    roleMember = foundRoleMember._id;
    roleAdmin = foundRoleAdmin._id;
    roleSuperAdmin = foundRoleSuperAdmin._id;

    const objDefine = {
      "email": req.value.body.email,
      "name": req.value.body.name,
      "phone": req.value.body.phone,
      "password": req.value.body.password,
      "presenter": req.value.body.presenter,
      "imageAvatar": "",
      "_role": roleMember
    };
    const newUser = await new Account( objDefine );
    const sessionToken = await signToken( newUser );

    // Create defaul post auto for user
    const defaultPostCategory = await new PostCategory( { "title": dictionary.DEFAULT_POSTCATEGORY, "_account": newUser._id } );

    await defaultPostCategory.save();

    await res.cookie( "sid", sessionToken, option );
    await res.cookie( "uid", newUser._id, option );
    const expireDate = new Date( newUser.created_at );

    newUser.expireDate = expireDate.setDate( expireDate.getDate() + 3 );
    Date.now() >= newUser.expireDate.getTime() ? ( newUser.status = 0 ) : ( newUser.status = 1 );
    await newUser.save();
    req.body.ip ? await Account.findByIdAndUpdate(
      newUser._id,
      { "$push": { "ip": req.body.ip } },
      { "new": true }
    ).select( "-password" ) : newUser.ip;
    newUser._role.toString() === roleMember.toString() ? res.cookie( "c_fr", 0, option ) : newUser._role.toString() === roleAdmin.toString() ? res.cookie( "c_fr", 1, option ) : newUser._role.toString() === roleSuperAdmin.toString() ? res.cookie( "c_fr", 2, option ) : res.status( 405 ).json( jsonResponse( "You are not assign!", null ) );
    // Add cfr to data storage of browser
    if ( newUser._role.toString() === roleMember.toString() ) {
      role = randomString.generate( 10 ) + 0 + randomString.generate( 1997 );
    } else if ( newUser._role.toString() === roleAdmin.toString() ) {
      role = randomString.generate( 10 ) + 1 + randomString.generate( 1997 );
    } else if ( newUser._role.toString() === roleSuperAdmin.toString() ) {
      role = randomString.generate( 10 ) + 2 + randomString.generate( 1997 );
    }
    res.status( 200 ).json(
      jsonResponse( "Successfully!", {
        "_id": newUser._id,
        "email": newUser.email,
        "token": sessionToken,
        "role": role
      } )
    );
  },
  /**
   * Login Local Using Passport Middleware By User
   * @param req
   * @param res
   * @returns {Promise<*|Promise<any>>}
   */
  "signIn": async ( req, res ) => {
    const foundUser = await Account.findById( req.user._id )
      .select( "-password" )
      .lean();
    // check expire date

    if ( Date.now() >= foundUser.expireDate.getTime() ) {
      await Account.findByIdAndUpdate(
        req.user._id,
        { "$set": { "status": 0 } },
        { "new": true }
      );
      return res.status( 405 ).json(
        jsonResponse( "Account expire, please buy license to continue", {
          "token": [],
          "user": null
        } )
      );
    }
    if ( foundUser.status === false ) {
      return res
        .status( 405 )
        .json(
          jsonResponse(
            "Tài khoản của bạn đã ngừng hoạt động vui lòng liên hệ hỗ trợ!",
            null
          )
        );
    }
    if ( req.body.ip && req.body.ip !== null ) {
      let checkExist = false;

      if ( foundUser.ip === undefined || foundUser.ip.length === 0 ) {
        await Account.findByIdAndUpdate(
          foundUser._id,
          { "$push": { "ip": req.body.ip } },
          { "new": true }
        ).select( "-password" );
      } else {
        foundUser.ip.map( async ( ip ) => {
          if ( ip.query === req.body.ip.query ) {
            checkExist = true;
            return checkExist;
          }
        } );
        if ( checkExist === false ) {
          await Account.findByIdAndUpdate(
            foundUser._id,
            { "$push": { "ip": req.body.ip } },
            { "new": true }
          ).select( "-password" );
        }
      }
    }
    // Role for user
    let roleMember;
    let roleAdmin;
    let roleSuperAdmin;
    const foundRoleMember = await Role.findOne( { "level": "Member" } );
    const foundRoleAdmin = await Role.findOne( { "level": "Admin" } );
    const foundRoleSuperAdmin = await Role.findOne( { "level": "SuperAdmin" } );

    roleMember = foundRoleMember._id;
    roleAdmin = foundRoleAdmin._id;
    roleSuperAdmin = foundRoleSuperAdmin._id;
    // Generate the token
    const sessionToken = await signToken( req.user );

    res.cookie( "sid", sessionToken, option );
    res.cookie( "uid", foundUser._id.toString(), option );
    foundUser._role.toString() === roleMember.toString() ? res.cookie( "c_fr", 0 ) : foundUser._role.toString() === roleAdmin.toString() ? res.cookie( "c_fr", 1, option ) : foundUser._role.toString() === roleSuperAdmin.toString() ? res.cookie( "c_fr", 2, option ) : res.status( 405 ).json( jsonResponse( "You are not assign!", null ) );
    if ( foundUser._role.toString() === roleMember.toString() ) {
      role = randomString.generate( 10 ) + 0 + randomString.generate( 1997 );
    } else if ( foundUser._role.toString() === roleAdmin.toString() ) {
      role = randomString.generate( 10 ) + 1 + randomString.generate( 1997 );
    } else if ( foundUser._role.toString() === roleSuperAdmin.toString() ) {
      role = randomString.generate( 10 ) + 2 + randomString.generate( 1997 );
    }
    res.status( 200 ).json(
      jsonResponse( "Successfully!", {
        "token": sessionToken,
        "user": foundUser,
        "role": role
      } )
    );
  },
  /**
   * Get User (Query can get one data)
   * @param req
   * @param res
   * @returns {Promise<*|Promise<any>>}
   */
  "index": async ( req, res ) => {
    const dataFound = await Account.find( req.query )
      .select( "-password" )
      .populate( {
        "path": "_role",
        "select": "level"
      } );

    if ( !dataFound ) {
      return res.status( 403 ).json( jsonResponse( "Data is not found!", null ) );
    }
    res.status( 200 ).json( jsonResponse( "Data fetch successfully!", dataFound ) );
  },
  /**
   *  Update User (Note: Have to header['Authorization']
   * @param req
   * @param res
   * @returns {Promise<*|Promise<any>>}
   */
  "update": async ( req, res ) => {
    const { body } = req;
    const email = secure( res, req.headers.authorization );
    const foundUser = await Account.findOne( { "email": email } );

    if ( !foundUser ) {
      return res
        .status( 403 )
        .json( jsonResponse( "Người dùng không tồn tại!", null ) );
    }

    const dataResponse = await Account.findByIdAndUpdate(
      foundUser._id,
      {
        "$set": body
      },
      {
        "new": true
      }
    ).select( "-password" );

    // join property email to data send
    update( `${process.env.SERVER_PARENT}/users`, req.headers, body );

    res
      .status( 201 )
      .json( jsonResponse( "Update account successfull!", dataResponse ) );
  },
  /**
   * delete user by id
   * @param req
   * @param res
   * @returns {Promise<*|Promise<any>>}
   */
  "updateExpire": async ( req, res ) => {
    const authorization = req.headers.authorization;
    const role = req.headers.cfr;
    const userId = secure( res, authorization );
    const accountAdminResult = await Account.findById( userId );

    if ( !accountAdminResult ) {
      return res
        .status( 403 )
        .json( jsonResponse( "Người dùng không tồn tại!", null ) );
    }
    // Role for user
    let roleMember;
    let roleAdmin;
    let roleSuperAdmin;
    const foundRoleMember = await Role.findOne( { "level": "Member" } );
    const foundRoleAdmin = await Role.findOne( { "level": "Admin" } );
    const foundRoleSuperAdmin = await Role.findOne( { "level": "SuperAdmin" } );

    roleMember = foundRoleMember._id;
    roleAdmin = foundRoleAdmin._id;
    roleSuperAdmin = foundRoleSuperAdmin._id;

    if (
      accountAdminResult._role.toString() !== roleAdmin.toString() && accountAdminResult._role.toString() !== roleSuperAdmin.toString()
    ) {
      return res
        .status( 405 )
        .json( jsonResponse( "Bạn không có quyền truy cập !!!!!!", null ) );
    }
    if ( decodeRole( role, 10 ) === 1 ) {
      const foundUser = await Account.findById( req.query._userId ).select(
        "-password "
      );

      if ( !foundUser ) {
        return res
          .status( 403 )
          .json( jsonResponse( "Người dùng không tồn tại!", null ) );
      }
      if (
        foundUser._role.toString() === roleAdmin.toString() || foundUser._role.toString() === roleSuperAdmin.toString()
      ) {
        return res
          .status( 405 )
          .json(
            jsonResponse( "Bạn không có quyền thực hiện chức năng này!", null )
          );
      }
      if ( req.body._role ) {
        return res
          .status( 405 )
          .json( jsonResponse( "Bạn không được cài đặt quyền người dùng!", null ) );
      }
      const result = await Account.findByIdAndUpdate(
        req.query._userId,
        { "$set": req.body },
        { "new": true }
      );

      return res
        .status( 201 )
        .json( jsonResponse( "Gia hạn người dùng thành công!", result ) );
    }
    if ( decodeRole( role, 10 ) === 2 ) {
      const foundUser = await Account.findById( req.query._userId ).select(
        "-password"
      );

      if ( !foundUser ) {
        return res
          .status( 403 )
          .json( jsonResponse( "Người dùng không tồn tại!", null ) );
      }
      if ( foundUser._role.toString() === roleSuperAdmin.toString() ) {
        return res
          .status( 405 )
          .json(
            jsonResponse( "Bạn không có quyền thực hiện chức năng này!", null )
          );
      }
      const objUpdate = {
        "expireDate": req.body.expireDate,
        "maxAccountFb": req.body.maxAccountFb,
        "status":
          req.body.status === true || req.body.status === false ? req.body.status : foundUser.status
      };

      if ( req.body._role ) {
        if (
          convertUnicode( req.body._role.trim().toLowerCase() ).toString() === "member"
        ) {
          objUpdate._role = roleMember.toString();
        }
        if (
          convertUnicode( req.body._role.trim().toLowerCase() ).toString() === "admin"
        ) {
          objUpdate._role = roleAdmin.toString();
        }
        if (
          convertUnicode( req.body._role.trim().toLowerCase() ).toString() === "superadmin"
        ) {
          objUpdate._role = roleSuperAdmin.toString();
        }
      }
      const result = await Account.findByIdAndUpdate(
        req.query._userId,
        { "$set": objUpdate },
        { "new": true }
      );

      return res
        .status( 201 )
        .json( jsonResponse( "Gia hạn người dùng thành công!", result ) );
    }
    res
      .status( 405 )
      .json( jsonResponse( "Bạn không có quyền truy cập !!!!!!", null ) );
  },
  /**
   * Delete user
   * @param req
   * @param res
   * @returns {Promise<*|Promise<any>>}
   */
  "deleteUser": async ( req, res ) => {
    const userId = secure( res, req.headers.authorization );
    const role = req.headers.cfr;
    const foundUserAdmin = await Account.findById( userId );

    if ( !foundUserAdmin ) {
      return res
        .status( 403 )
        .json( jsonResponse( "User Admin is not found!", null ) );
    }
    // Role for user
    let roleAdmin;
    let roleSuperAdmin;
    const foundRoleMember = await Role.findOne( { "level": "Member" } );
    const foundRoleAdmin = await Role.findOne( { "level": "Admin" } );
    const foundRoleSuperAdmin = await Role.findOne( { "level": "SuperAdmin" } );

    roleMember = foundRoleMember._id;
    roleAdmin = foundRoleAdmin._id;
    roleSuperAdmin = foundRoleSuperAdmin._id;
    if (
      foundUserAdmin._role.toString() !== roleAdmin.toString() && foundUserAdmin._role.toString() !== roleSuperAdmin.toString()
    ) {
      return res
        .status( 405 )
        .json( jsonResponse( "Bạn không phải là admin!", null ) );
    }
    if ( decodeRole( role, 10 ) === 1 ) {
      const users = req.body.userId;
      let checkExist = false;

      await Promise.all(
        users.map( async ( val ) => {
          const foundUser = await Account.findById( val );

          return foundUser === null;
        } )
      ).then( ( result ) => {
        result.map( ( value ) => {
          if ( value === true ) {
            checkExist = true;
            return checkExist;
          }
        } );
      } );
      if ( checkExist ) {
        return res
          .status( 405 )
          .json(
            jsonResponse(
              "Một trong số tài khoản người dùng không có trong hệ thống!",
              null
            )
          );
      }
      const checkUser = arrayFunction.removeDuplicates( users );

      checkUser.map( async ( val ) => {
        const foundUser = await Account.findById( val );

        if (
          foundUser._role.toString() === roleAdmin.toString() || foundUser._role.toString() === roleSuperAdmin.toString()
        ) {
          return;
        }
        await Account.findByIdAndRemove( val );
      } );
      return res
        .status( 200 )
        .json( jsonResponse( "Delete user successfull!", null ) );
    }
    if ( decodeRole( role, 10 ) === 2 ) {
      const users = req.body.userId;
      let checkExist = false;

      await Promise.all(
        users.map( async ( val ) => {
          const foundUser = await Account.findById( val );

          return foundUser === null;
        } )
      ).then( ( result ) => {
        result.map( ( value ) => {
          if ( value === true ) {
            checkExist = true;
            return checkExist;
          }
        } );
      } );
      if ( checkExist ) {
        return res
          .status( 405 )
          .json(
            jsonResponse(
              "Một trong số tài khoản người dùng không có trong hệ thống!",
              null
            )
          );
      }
      const checkUser = arrayFunction.removeDuplicates( users );

      checkUser.map( async ( val ) => {
        const foundUser = await Account.findById( val );

        if ( foundUser._role.toString() === roleSuperAdmin.toString() ) {
          return;
        }
        await Account.findByIdAndRemove( val );
      } );
      return res
        .status( 200 )
        .json( jsonResponse( "Delete user successfull!", null ) );
    }
    res
      .status( 405 )
      .json( jsonResponse( "Only Admin and SuperAdmin do posts!!", null ) );
  },
  /** *
   * Change password for user
   * @param req
   * @param res
   * @returns {Promise<*|Promise<any>>}
   */
  "changePassword": async ( req, res ) => {
    const userId = secure( res, req.headers.authorization );
    const { body } = req;

    if ( !userId ) {
      return res.status( 405 ).json( jsonResponse( "Not authorized!", null ) );
    }
    const foundUser = await Account.findById( userId );

    if ( !foundUser ) {
      return res.status( 403 ).json( jsonResponse( "User is not found!", null ) );
    }
    if ( JSON.stringify( userId ) !== JSON.stringify( foundUser._id ) ) {
      return res.status( 403 ).json( jsonResponse( "Authorized is wrong!", null ) );
    }
    const isPassword = await foundUser.isValidPassword( body.password );

    if ( !isPassword ) {
      return res.status( 403 ).json( jsonResponse( "Password is wrong!", null ) );
    }
    foundUser.password = body.newPassword;
    await foundUser.save();
    res.status( 201 ).json( jsonResponse( "Change Password successfully!", null ) );
  },
  /**
   * create new password after forget password
   * @param req
   * @param res
   * @returns {Promise<*|Promise<any>>}
   */
  "createNewPassword": async ( req, res ) => {
    const userId = req.query._userId;
    const { body } = req;

    if ( !userId ) {
      return res.status( 405 ).json( jsonResponse( "Not authorized!", null ) );
    }
    const foundUser = await Account.findById( userId );

    if ( !foundUser ) {
      return res.status( 403 ).json( jsonResponse( "User is not found!", null ) );
    }
    if ( JSON.stringify( userId ) !== JSON.stringify( foundUser._id ) ) {
      return res.status( 403 ).json( jsonResponse( "Authorized is wrong!", null ) );
    }
    foundUser.password = body.newPassword;
    await foundUser.save();
    res.status( 201 ).json( jsonResponse( "Change Password successfully!", null ) );
  },
  /**
   * forget password & send email confirm
   * @param req
   * @param res
   * @param next
   * @returns {Promise<*|Promise<any>>}
   */
  "resetPassword": async ( req, res, next ) => {
    if ( !req.body.email ) {
      return res
        .status( 405 )
        .json( jsonResponse( "Vui lòng cung cấp email!", null ) );
    }
    const foundUser = await Account.findOne( {
      "email": req.body.email
    } );

    if ( !foundUser ) {
      return res
        .status( 405 )
        .json( jsonResponse( "Người dùng không tồn tại!", null ) );
    }

    let code = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for ( let i = 0; i < 6; i++ ) {
      code += possible.charAt( Math.floor( Math.random() * possible.length ) );
    }

    // Use Smtp Protocol to send Email
    const transporter = await nodemailer.createTransport( {
      "service": "Gmail",
      "auth": {
        "user": process.env.MAIL_USERNAME,
        "pass": process.env.MAIL_PASSWORD
      }
    } );

    const html = `
      <div>
        <img src="http://zinbee.vn/assets/landing/image/logo/zinbee.png"> <br>
        <span style="font-size: 20px">Email tự động xác nhận passcode</span><br>
        <span style="font-size: 20px"><b>Code: ${code}</b> </span>
      </div>`;

    await transporter.sendMail(
      {
        "from": process.env.MAIL_USERNAME,
        "to": req.body.email,
        "subject": "Confirm reset password",
        "html": html
      },
      // eslint-disable-next-line no-unused-vars
      ( err, info ) => {
        if ( err ) {
          return next( err );
        }
      }
    );
    const updateUser = await Account.findOneAndUpdate(
      {
        "email": req.body.email
      },
      {
        "code": code
      }
    ).select( "-password" );

    if ( !updateUser ) {
      return res
        .status( 405 )
        .json( jsonResponse( "Lỗi trong quá trình cập nhật mật khẩu!", null ) );
    }
    /**
     * Cron job runs every minute set
     */
    await new CronJob(
      "* 5 * * * *",
      async () => {
        const user = await Account.findById( foundUser._id );

        if ( user.code === "" || user.code === null ) {
          return false;
        }
        user.code = "";
        await Account.findByIdAndUpdate(
          foundUser._id,
          { "$set": { "code": "" } },
          { "new": true }
        ).select( "-password" );
        return true;
      },
      null,
      true,
      "Asia/Ho_Chi_Minh"
    );
    return res
      .status( 201 )
      .json( jsonResponse( "Cập nhật mật khẩu thành công!", null ) );
  },
  /**
   * check code
   * @param req
   * @param res
   * @returns {Promise<*|Promise<any>>}
   */
  "checkCode": async ( req, res ) => {
    const { email, code } = req.body;

    if ( !email || !code ) {
      return res.status( 405 ).json( jsonResponse( "Not email or not code!", null ) );
    }
    const foundUser = await Account.findOne( {
      email
    } );

    if ( !foundUser ) {
      return res.status( 405 ).json( jsonResponse( "Not found User!", null ) );
    }
    if ( code !== foundUser.code ) {
      return res.status( 405 ).json( jsonResponse( "Code false!", null ) );
    }
    await Account.findByIdAndUpdate(
      foundUser._id,
      { "$set": { "code": "" } },
      { "new": true }
    ).select( "-password" );
    return res.status( 201 ).json( jsonResponse( "Code successfully!", null ) );
  },
  /**
   * Get Info User when forget password by email
   * @param req
   * @param res
   * @returns {Promise<*|Promise<any>>}
   */
  "getInforUserLostPass": async ( req, res ) => {
    const foundUser = await Account.findOne( {
      "email": req.query.email
    } ).select( "name email imageAvatar" );

    if ( !foundUser ) {
      return res
        .status( 405 )
        .json( jsonResponse( "Người dùng không tồn tại!", null ) );
    }
    res
      .status( 200 )
      .json( jsonResponse( "Đây là tài khoản cũ của ban", foundUser ) );
  },
  /**
   * Upload
   * @param req
   * @param res
   * @returns {Promise<*|Promise<any>>}
   */
  "upload": async ( req, res ) => {
    const userId = secure( res, req.headers.authorization );
    const foundUser = await Account.findById( userId ).select( "-password" );

    if ( !foundUser ) {
      return res
        .status( 403 )
        .json( jsonResponse( "Người dùng không tồn tại!", null ) );
    }
    foundUser.imageAvatar = `${process.env.APP_URL}:${process.env.PORT_BASE}/${ req.file.path.replace( /\\/gi, "/" )}`;
    await Account.findByIdAndUpdate(
      userId,
      { "$set": { "imageAvatar": foundUser.imageAvatar } },
      { "new": true }
    ).select( "-password" );
    res
      .status( 200 )
      .json( jsonResponse( "Cập nhật ảnh đại diện thành công", foundUser ) );
  },
  /**
   * Active by key
   * @param req
   * @param res
   * @returns {Promise<*|Promise<any>>}
   */
  "active": async ( req, res ) => {
    if ( req.body.presenter === undefined || req.body.presenter.length === 0 ) {
      return res.status( 404 ).json( { "status": "fail", "presenter": "Mã kích hoạt không được để trống" } );
    }

    const userId = secure( res, req.headers.authorization ),
      userInfo = await Account.findOne( { "_id": userId } ),
      roleUser = await Role.findOne( { "_id": userInfo._role } );

    // Check role and permission
    if ( roleUser.level.toLowerCase() !== "superadmin" && roleUser.level.toLowerCase() !== "admin" ) {
      return res.status( 405 ).json( { "status": "errors.js", "message": "Bạn không có quyền để thực hiện chức năng này!" } );
    }

    // Active by key
    if ( req.body.presenter && req.body.presenter.length > 0 ) {
      // find all user have key
      const userList = await Account.find( { "presenter": req.body.presenter } );

      if ( userList.length === 0 ) {
        return res.status( 404 ).json( { "status": "errors.js", "message": "Mã kích hoạt không tồn tại!" } );
      }

      await Promise.all( userList.map( async ( user ) => {
        user.status = 1;
        user.expireDate = req.body.expireDate;

        await Account.findByIdAndUpdate(
          user._id,
          { "$set": user },
          { "new": true }
        );
      } ) );
    }

    res.status( 201 ).json( jsonResponse( "success", null ) );
  }

};
