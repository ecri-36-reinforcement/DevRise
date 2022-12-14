const axios = require('axios');
const controller = require('./controller');
const jwt = require('jsonwebtoken');

const getOAuthToken = async code => {
  try {
    const gitHubOAuthAccessTokenUrl =
      'https://github.com/login/oauth/access_token';

    const params = {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      code: code,
    };

    const headers = {
      Accept: 'application/json',
    };

    const accessTokenResponse = await axios.post(
      gitHubOAuthAccessTokenUrl,
      {},
      { params, headers }
    );

    return { gitHubToken: accessTokenResponse.data.access_token };
  } catch (error) {
    console.log('Err is getOauthToken', error.message);
    return { gitHubToken: 'Invalid code' };
  }
};

const getGitHubUserData = async oauthAccessToken => {
  try {
    const { data } = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${oauthAccessToken}`,
        Accept: 'application/json',
      },
    });
    if (!data.email) {
      const userEmails = await axios.get('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${oauthAccessToken}`,
          Accept: 'application/json',
        },
      });
      const userPrimaryEmailObject = userEmails.data.filter(
        e => e.primary === true
      );
      data.email = userPrimaryEmailObject[0].email;
    }
    return { gitHubUserData: data };
  } catch (error) {
    console.log(error.message);
  }
};

const generateJWT = userObject => {
  const { name, email, userId, dailyAppCount } = userObject;
  const token = jwt.sign(
    {
      userId,
      name,
      email,
      dailyAppCount,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: 3_600_000,
    }
  );
  return {
    token,
  };
};

const handleOAuth = async (code, loginOrRegister) => {
  try {
    const { gitHubToken } = await getOAuthToken(code);
    if (!gitHubToken) throw new Error('Invalid credentials');
    const { gitHubUserData } = await getGitHubUserData(gitHubToken);

    // console.log(gitHubUserData);
    if (loginOrRegister === 'register') {
      const { name, email } = gitHubUserData;
      const user = await controller.createUser({
        name,
        email,
        registerType: 'oauth',
      });
      return generateJWT({
        userId: user._id,
        name: user.name,
        email: user.email,
        dailyAppCount: user.daily_job_count,
      });
    }

    if (loginOrRegister === 'login') {
      const user = await controller.getUser(gitHubUserData.email);
      console.log(user);
      return generateJWT({
        userId: user._id,
        name: user.name,
        email: user.email,
        dailyAppCount: user.daily_job_count,
      });
    }
  } catch (error) {
    console.log('Error in handleOauth', error.message);
  }
};

module.exports = { handleOAuth };

// ########################################################################################################
// const handleQuiLOAuth = async (code, type) {
//     try {
//         const { gitHubToken } = await getOAuthToken(code);

//         if (!gitHubToken) throw new Error('Invalid credentials');

//         const { gitHubUserData } = await getGitHubUserData(gitHubToken);

//         if (type === 'register') {
//             const exisitingUser = await controller.getUser(gitHubUserData.login);

//             if (exisitingUser) {
//                 return generateJWT(exisitingUser);
//             } else {
//                 const newUserObj = buildNewGitHubUserData(gitHubUserData);
//         // We changed this to dev rise
//         const createdUser = await controller.createUser(userData, 'register');
//         if (createdUser.success) {
//             return generateJWT(createdUser);
//         } else throw new Error('Error creating account');
//     }
// }

// if (type === 'signin') {
//     const { login } = gitHubUserData;
//     const user = await controller.getUser(login);
//     if (user.success) {
//         return generateJWT(user);
//     } else throw new Error('Error fetching account');
// }
// } catch (error) {
//     return { token: null };
// }
// }
// export async function getOAuthToken(code) {
//   try {
//     const gitHubOAuthAccessTokenUrl =
//       'https://github.com/login/oauth/access_token';

//     const params = {
//       client_id: process.env.CLIENT_ID,
//       client_secret: process.env.CLIENT_SECRET,
//       code: code,
//     };

//     const headers = {
//       Accept: 'application/json',
//     };

//     const accessTokenResponse = await axios.post(
//       gitHubOAuthAccessTokenUrl,
//       {},
//       { params, headers }
//     );

//     return { gitHubToken: accessTokenResponse.data.access_token };
//   } catch (error) {
//     console.log(error.message);
//     return { gitHubToken: 'Invalid code' };
//   }
// }

// export function buildNewGitHubUserData(gitHubUserData) {
//   return {
//     oauthUser: true,
//     name: gitHubUserData.name,
//     username: gitHubUserData.login,
//     avatarUrl: gitHubUserData.avatar_url,
//   };
// }

// export function generateJWT(userObject) {
//   const token = jwt.sign(
//     {
//       username: userObject.username,
//       userId: userObject.userId,
//       name: userObject.name,
//       avatarUrl: userObject.avatarUrl,
//     },
//     process.env.JWT_SECRET,
//     {
//       expiresIn: 3_600_000,
//     }
//   );

//   return {
//     token,
//   };
// }
