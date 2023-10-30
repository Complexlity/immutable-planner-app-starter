# Immutable Passport Integration

In this guide, I will cover step by step the process of adding immutable passport authentication to an applilcation and creating transactions with it.

Before proceeding, Note that this could be done in plain html/javascript as well as all javascript frameworks including [svelte](https://svelte.dev/), [react](https://react.dev/), [vue](https://vuejs.org/), etc. For this guide, we would make use of [Nextjs](https://nextjs.org).

However, all the core concepts convered here are applicable to all of them.

## Pre-requisites

The follow this guide, ensure you have the following installed

- [npm/nodejs](https://nodejs.org/en)
- A Code Editor

## Getting Started

Run the following commands on your terminal to get started

```bash
git clone https://github.com/Complexlity/immutable-planner-app-starter immutable-planner-app
cd immutable-planner-app
npm install
npm run dev
```

Open <http://localhost:3001> in your browser

![Immutable Planner App Starter](image.png)

You can also find a [Live Example](https://immutable-planner-app-starter.vercel.app/)

## Register You Application On Immutable Hub

Create a new file `.env` and copy all the contents of [.env.example](.env.example) into it.

```.env
NEXT_PUBLIC_LOGOUT_URL=<Your Immutable Hub Logout URL>
NEXT_PUBLIC_CALLBACK_URL=<Your Immutable Hub Redirect URL>
NEXT_PUBLIC_CLIENT_ID=<Your Immutable Hub Client Id>
```

We need these three values to connect

- Logout URL
- Callback URL
- Client Id

Follow the steps below to get the required values

- Go to [hub.immutable.com](https://hub.immutable.com) and create an account.
- Initialize a project on Immutable zkEvm and a default Environment on Testnet. If you're unsure how to do that, Complete this [Quest 3 Guide](https://app.stackup.dev/quest_page/quest-3---create-an-immutable-passport)
- Add A passport Client
![Alt text](image-1.png)
- Fill the form provided with the following steps

![Alt text](image-2.png)

1. **Application** Type: Web application (remains unchanged). This represents where the application is intented to be run
2. **Client Name**: give your application any name. This is just an identifier.
3. **Logout URLs**: This is very **IMPORTANT**. It represents the url the user is redirected to after they logout of the application (In some applications,the default landing page). E.g `https://your-site-name.com/`.
Since we would be runnig the code locally on port `3001`. Enter <http://localhost:3001> into the input box
4. **Callback URLs**: Also very **IMPORTANT**. When you try to login, it opens a popup direct to this url. This is where the logging in takes place. E.g `https://your-site-name.com/login`.
Since we are runnign the code on our dev server port `3001`, Enter <http://localhost:3001/login> into the input box

**IMPORTANT**: When you deploy, you also have to change these URLs to point to the site address.

Click **Create** once you have filled these values.

![Alt text](image-3.png)

Copy the three values and replace them in the `.env` file.

## The Bug Before The Storm

In the course of writing this guide, I ran into a bug in the sdk where it looks for the `global` and `process`. If you ever encounter errors such as `global object missing` or `process missing`, simply add the code above to be run before all others.

```javascript
if (typeof global === 'undefined') {
    window.global = window;
   }

   if (typeof process === 'undefined') {
    window.process = { env: { NODE_ENV: 'production' } };
   }
```

## Initialise the Passport object

The main package that enables all the passport functions is `@imtbl/sdk`. First we have to install this package into the project.

```bash
npm install @imtbl/sdk
```

To have access to immutable authentication, you have to import functions `config` and `passport` which will be used to create a new passport instance object.

```javascript
//import the needed functions
import { config, passport } from '@imtbl/sdk';

// Initialize the passport config
const passportConfig = {
  baseConfig: new config.ImmutableConfiguration({
    environment: config.Environment.SANDBOX
  }),
  // This is the client id obtained from the immutable hub
  clientId: process.env.NEXT_PUBLIC_CLIENT_ID,

  // This is the callback url obtained from the immutable hub
  redirectUri: process.env.CALLBACK_URL,

  // This is the logour url obtained from the immutable hub
  logoutRedirectUri: process.env.NEXT_PUBLIC_LOGOUT_URL,
  audience: 'platform_api',
  scope: 'openid offline_access email transact'
};

// Create a new passport instance
const passportInstance = typeof window !== 'undefined' ? new passport.Passport(passportConfig) : undefined

```

`typeof window === undefined`. This is a very important step for bundlers and in our Nextjs use case. This is intended to be run only on the browser so the window object would be undefined on the server.

In the [src folder]('/src') of the project, create a folder `store` and create a file `passportStore.js` in the newly created folder and copy the contents below into it

<details>
<summary>store/passportStore.js</summary>
<code>
<pre>
import { createContext, useContext, useState, useReducer } from 'react';
import { config, passport } from '@imtbl/sdk';

const passportConfig = {
  baseConfig: new config.ImmutableConfiguration({
    environment: config.Environment.SANDBOX
  }),
  clientId: process.env.NEXT_PUBLIC_CLIENT_ID,
  redirectUri: process.env.NEXT_PUBLIC_CALLBACK_URL,
  logoutRedirectUri: process.env.NEXT_PUBLIC_LOGOUT_URL,
  audience: 'platform_api',
  scope: 'openid offline_access email transact'
};

const passportInstance = typeof window !== 'undefined' ? new passport.Passport(passportConfig) : undefined

export const MyContext = createContext();

export function MyProvider({ children }) {
  const [passportState] = useState(passportInstance);

  return (
    <MyContext.Provider value={{ passportState }}>
      {children}
    </MyContext.Provider>
  );
}

export function useMyContext() {
  return useContext(MyContext);
}
</pre>
</code>
</details>

Also replace the file contents in [src/pages/_app.js](src/pages/_app.js) with the code below

<details>
  <summary>src/pages/_app.js</summary>
<code>
<pre>
import '@/styles/globals.css'
import "@/styles/App.css";
import "@/styles/styles.css"
import { MyProvider } from '@/store/passportStore'

export default function App({ Component, pageProps }) {
  return(
   `<MyProvider>`
    <Component {...pageProps} />
   `</MyProvider>`
  )
}
</pre>
</code>
</details>

We have created a react context store and put the passport object. This is done so the same passport object is reusable in multiple components (as we would need it). In a different framework, you could as well do something similar though the syntaxes may differ

## Log In User With Passport

After initialising the passport object, we can login a user by running the two commands below

```javascript
const providerZkevm = passportInstance.connectEvm()
const accounts = await providerZkevm.request({ method: "eth_requestAccounts" })
```

First, we create a zkEVM provider. This initializes an object that can be used to interact directly with the blockchain using the details of the passportInstance

Secondly, we call an RPC named `eth_requestAccounts`. This is what trigger's the entire login process. It returns an array containing the addresses associated with the user

*Aside*: An RPC (Remote Procedure Call) is simply a defined method provided by the library (in our case) to interact with the ethereum blockchain. In the course of this guide, we would explore some other examples of it

After calling `eth_requestAccoutns`,  a popup opens the `Callback Url` (In our case, `/login`)
In this route, we would handle the logging in inside the popup and return the data to the home page

```javascript
await passportInstance.loginCallback()
```

This is the single line of code used in the `/login` route and it should be made to be called on page load

- Plain javascript

```javascript
window.addEventlistener('load',() => {
  await passportInstance.loginCallback()
})
```

- React

```javascript
useEffect(() => {
  (async() => {
    await passportInstance.logCallback()
  })()
})
```

- Svelte

```javascript
onMount(async () => {
    await passportInstance.loginCallback()
  });
```

These are some different ways to handle it in different frameworks. The most important thing is to do so on page load

Update [src/components/NavBar.jsx](src/components/NavBar.jsx) to add the login function

<details>
<summary>src/components/NavBar.jsx</summary>
<code>
<pre>
'use client'

import { useMyContext } from "@/store/passportStore";
import Head from "next/head";
import { useState } from 'react';

export default function NavButton() {
  const {passportState: passportInstance, userInfo, dispatch } = useMyContext();
  const [buttonState, setButtonState] = useState('Connect Passport')
  const [isLoading, setIsLoading] = useState(false)

  async function login() {
    if (!passportInstance) return
    setButtonState("...Connecting")
    setIsLoading(true)
    try {
      console.log("I am connecting now")
      const providerZkevm = passportInstance.connectEvm()
      const accounts = await providerZkevm.request({ method: "eth_requestAccounts" })
      // Set the address
      dispatch({
        type: 'add_user_info',
        key: 'address',
        value: accounts[0]
      })
    } catch (error) {
    console.log("Something went wrong")
        console.log({ error })
        setButtonState('Connect Passport')
          throw error
    } finally {
      setIsLoading(false)
    }
    setButtonState('Connected')
    return

  }

  async function logout() {
    // Logout Function Go Here
    return
}

  return (
 <>
`<Head>`
        `<title>Immutable Planner App</title>`
        `<meta name="description" content="Generated by create next app" />`
        `<meta name="viewport" content="width=device-width, initial-scale=1" />`
        `<link rel="icon" href="/favicon.ico" />`
      `</Head>`
      `<div className="fixed flex justify-end px-4 gap-4 top-0 backdrop-blur-md py-4   w-full">`
          {
            buttonState === 'Connected'
            ?
            <>
              `<p className="px-4 py-2 bg-teal-600 rounded-lg text-gray-200 flex items-center justify-center">`{userInfo.email ?? "Hello world"} </`p>`
                  `<p className="px-4 py-2 bg-teal-600 rounded-lg text-gray-200 flex items-center justify-center">{userInfo.address ?? "Hello world" }</p>`
            `<button onClick={logout} className="bg-red-500 text-grey-800 px-4 py-2 opacity-100 rounded-full text-lg  text-gray-100">Logout</button>`
            </>
            : `<button disabled={isLoading} className="text-grey-100 px-4 py-2 opacity-100 rounded-full bg-green-500" onClick={login}>`
          {buttonState}
        `</button>`
          }
        `</div>`
      </>
  );
}
</pre>
</code>
</details>

Create a file in [src/pages/](src/pages/) and call it `login.js`. This is where we would handle the loginCallback(). Also note that this url would match the `Callback Url` we have set in [hub.immutable.com](https://hub.immutable.com) while creating the passport client

<details>
<summary>src/pages/login.js</summary>
<code>
<pre>
import { useEffect } from 'react';
import { useMyContext } from '@/store/passportStore';

export default function LoginPage() {
  const { passportState: passportInstance,  } = useMyContext();
  useEffect(() => {
    async function handleLoginCallback() {
      if (!passportInstance) {
        return
      }
    try {
        console.log("login callback");
        await passportInstance.loginCallback();
    }
    catch (err) {
        console.error("login callback error", err);
    }
    }
    handleLoginCallback()
  }, []);

  return (
    `<div/>`
  );
}
</pre>
</code>
</details>

Update [src/store/passportStore.js](src/store/passportStore.js) to store the user details

<details>
<summary>src/store/passportStore.js</summary>
<code>
<pre>
import { createContext, useContext, useState, useReducer } from 'react';
import { config, passport } from '@imtbl/sdk';

const passportConfig = {
  baseConfig: new config.ImmutableConfiguration({
    environment: config.Environment.SANDBOX
  }),
  clientId: process.env.NEXT_PUBLIC_CLIENT_ID,
  redirectUri: process.env.NEXT_PUBLIC_CALLBACK_URL,
  logoutRedirectUri: process.env.NEXT_PUBLIC_LOGOUT_URL,
  audience: 'platform_api',
  scope: 'openid offline_access email transact'
};

const passportInstance = typeof window !== 'undefined' ? new passport.Passport(passportConfig) : undefined

export const MyContext = createContext();

export function MyProvider({ children }) {
  const [passportState] = useState(passportInstance);
  const [userInfo, dispatch] = useReducer(reducer, {address: null, email: null, nickname: null, idToken: null, accessToken: null})

  function reducer(state, action) {
    const key = action.key
    const value = action.value
    switch (action.type) {
      case "add_user_info": {
        return {
          ...state,
          [key]: value
        }
      }
      default: return state
    }
  }

  return (
    <MyContext.Provider value={{ passportState, userInfo, dispatch }}>
      {children}
    </MyContext.Provider>
  );
}

export function useMyContext() {
  return useContext(MyContext);
}
</pre>
</code>
</details>

We added a user object to the store. This enables us re-use and update this object in different parts of the codebase without having to recreate it.

After updating the files, test the login functionality now.

## Getting Logged In User Details

The `passportInstance` object comes with more functions to get the details of the logged in user. These only work if there's user currently signed in.
In your code, ensure to call the `eth_requestAccounts` function and be sure it doesn't error before trying to fetch the user details

1. User's Email and Nickname

```js
const userInfo = await passportInstance.getUserInfo()
```

On success, the returns an object of the shape:

```js
{
  email: <user's email>
  sub: <A unique identifier of the logged in user>
  nickname: <user's nickname>
}
```

You could then de-structure the object to get the nickname and the email.

```js
const email = userInfo.email
const nickname= userInfo.nickname
```

2. User's Access Token

Access tokens are used to re-authenticate the user. This value is important so the entire login process is not triggered every time the user reloads the page.

```js
const accessToken = await passportInstance.getAccessToken()
```

3. User's Id Token

This is an identifier for immutable passport users.

```js
const idToken = await passportInstance.getIdToken()
```

Now you  cold fetch and insert these values on the front end. We would show the user email and eth address on the Navbar while the other details will be shown on the Immutable Widget

Update [src/components/NavBar.jsx](src/components/NavBar.jsx) with the code below

<details>
<summary>src/components/NavBar.jsx</summary>
<code>
<pre>
'use client'

import { useMyContext } from "@/store/passportStore";
import Head from "next/head";
import Script from "next/script";
import { useReducer, useState } from 'react';

export default function NavButton() {
  const {passportState: passportInstance, userInfo, dispatch } = useMyContext();
  const [buttonState, setButtonState] = useState('Connect Passport')
  const [isLoading, setIsLoading] = useState(false)

  async function login() {
    if (!passportInstance) return
    setButtonState("...Connecting")
    setIsLoading(true)
    try {
      console.log("I am connecting now")
      const providerZkevm = passportInstance.connectEvm()
      const accounts = await providerZkevm.request({ method: "eth_requestAccounts" })
      // Set the address
      dispatch({
        type: 'add_user_info',
        key: 'address',
        value: accounts[0]
      })
      // Fetch user details
      const user = await passportInstance.getUserInfo()
      // Set the email
      dispatch({
        type: 'add_user_info',
        key: 'email',
        value: user.email
      })
      //set the nickname
      dispatch({
        type: 'add_user_info',
        key: 'nickname',
        value: user.nickname
      })
      // Fetch user access token
      const accessToken = await passportInstance.getAccessToken()
      // set the access token
      dispatch({
        type: 'add_user_info',
        key: 'accessToken',
        value: accessToken
      })
      // Fetch user's id token
      const idToken = await passportInstance.getIdToken()
      // set the id token
      dispatch({
        type: 'add_user_info',
        key: 'idToken',
        value: idToken
      })
    } catch (error) {
    console.log("Something went wrong")
        console.log({ error })
        setButtonState('Connect Passport')
          throw error
    } finally {
      setIsLoading(false)
    }
    setButtonState('Connected')
    return
  }
   async function logout() {
    // Logout Function Go Here
    return
}

  return (
 <>
`<Head>`
        `<title>Immutable Planner App</title>`
        `<meta name="description" content="Generated by create next app" />`
        `<meta name="viewport" content="width=device-width, initial-scale=1" />`
        `<link rel="icon" href="/favicon.ico" />`
      `</Head>`
      `<div className="fixed flex justify-end px-4 gap-4 top-0 backdrop-blur-md py-4   w-full">`
          {
            buttonState === 'Connected'
            ?
            <>
              `<p className="px-4 py-2 bg-teal-600 rounded-lg text-gray-200 flex items-center justify-center">`{userInfo.email ?? "Hello world"} </`p>`
                  `<p className="px-4 py-2 bg-teal-600 rounded-lg text-gray-200 flex items-center justify-center">{userInfo.address ?? "Hello world" }</p>`
            `<button onClick={logout} className="bg-red-500 text-grey-800 px-4 py-2 opacity-100 rounded-full text-lg  text-gray-100">Logout</button>`
            </>
            : `<button disabled={isLoading} className="text-grey-100 px-4 py-2 opacity-100 rounded-full bg-green-500" onClick={login}>`
          {buttonState}
        `</button>`
          }
        `</div>`
      </>
  );
}

</pre>
</code>
</details>

We're showing the user name and email. Also, we now show the logout button when the user is logged in.

Next, we need to populate the immutable widget with the required data. Update [src/components/widgets/ImmutableWidget.jsx](src/components/widgets/ImmutableWidget.jsx) with the code below

<details>
<summary>src/components/widgets/ImmutableWidget.jsx</summary>
<code>
<pre>
'use client'

import { useMyContext } from "@/store/passportStore";
import { useRef, useState } from 'react';

export default function ImmutableWidget() {
  const { passportState: passportInstance, userInfo } = useMyContext()

return (
    `<div className="min-w-[400px] max-w-[500px] grid gap-4 py-3 overflow-hidden">`
      `<details open>`
        `<summary className="text-white underline text-xl overflow-x-auto max-w-full mb-4">User Details</summary>`
      `<div className="tokens max-w-[500px]">`
        `<details open className="" ><summary>Id Token</summary>{userInfo.idToken ?? ""}</details>`
        `<details open><summary>Access Token</summary>{userInfo.accessToken ?? ""}</details>`
        `<details ><summary>Nickname</summary>{userInfo.nickname ?? "User has no nickname"}</details>`
      `</div>`
          `</details>`
          `</div>`
  );
}
</pre>
</code>
</details>

Now on the page, you should see the use details on the immutable widget

## Log Out A User

The `passportInstance` comes with a `logout` function which when called, logs the user out and redirect the page to the `Logout URLs` we specified while creating the passport client in [hub.immutable.com](https://hub.immutable.com)

Call `passportInstance.logout` in [src/components/NavBar.jsx](src/components/NavBar.jsx)

<details>
<summary>src/components/NavBar.jsx</summary>
<code>
<pre>
....Rest of the code
async function logout()  {
  // Logout Function Go Here
    await passportInstance.logout();
    setButtonState('Connect Passport')
}
...Restof the code
</pre>
</code>
</details>

And that's it. We are now able to login and logout the user.

## Interacting With The Blockchain using Passport

As stated [above](#log-in-user-with-passport), we could call other RPC function and interact with the blockchain once the user is signed in. The functions are called on the `providerZkevm` object and not the `passportInstance`

Here are some of them

1. Get Immutable X Gas Price

```js
const gasPrice = await providerZkevm.request({ method: 'eth_gasPrice' });
```

2. Get The Balance In an ETH address

```js
const userBalance = await providerZkevm.request({
      method: 'eth_getBalance',
      params: [
        userInfo.address,
        'latest'
      ]
});
```

3. Get Latest Block Number

```js
const latestBlockNumber = await providerZkevm.request({ method: 'eth_blockNumber' });
```

4. Get Chain Id

```js
const chainId = await providerZkevm.request({ method: 'eth_chainId' });
```

5. Get Transaction By Hash
This function fetch the transaction details of any transaction on the [Immutable Testnet Explorer](https://explorer.testnet.immutable.com/txs)

```js
const transaction = await provider.request({
  method: 'eth_getTransactionByHash',
  params: [
    <transaction hash />
  ]
});
```

Substitute `<transaction hash>` with any valid transaction on the immutable testnet and it would return it's value.

In our code, this function has been made to download the file as json the the user's computer

Update [src/componets/widgets/Immutable.jsx](src/components/widgets/ImmutableWidget.jsx)

<details>
<summary>src/components/widgets/ImmutableWidget.jsx</summary>
<code>
<pre>
'use client'

import { useMyContext } from "@/store/passportStore";
import { useRef, useState } from 'react';

export default function ImmutableWidget() {
  const { passportState: passportInstance, userInfo } = useMyContext()
  const providerZkevm = passportInstance?.connectEvm()
  const [isLoading, setIsLoading] = useState(false);
  const[gasPrice, setGasPrice] = useState('');
  const[userBalance, setUserBalance] = useState('');
  const[latestBlockNumber, setLatestBlockNumber] = useState('');
  const[chainId, setChainId] = useState('');

  async function getGasPrice() {
    if (!passportInstance || !userInfo.address) return
    setIsLoading(true)
    try {
      const gasPrice = await providerZkevm.request({ method: 'eth_gasPrice' });
      setGasPrice(gasPrice)
    } catch (error) {
      console.log(error)
    }
    finally {
      setIsLoading(false)
    }
  }

  async function getUserBalance() {
    console.log({user: userInfo.address})
    if (!passportInstance || !userInfo.address) return
    setIsLoading(true)
    try {
      const userBalance = await providerZkevm.request({
        method: 'eth_getBalance',
  params: [
    userInfo.address,
    'latest'
  ]
      });
      setUserBalance(userBalance)
    } catch (error) {
      console.log(error)
          }
    finally {
      setIsLoading(false)
    }
  }

  async function getLatestBlockNumber() {
    console.log({address: userInfo.address})
  if (!passportInstance || !userInfo.address) return
    setIsLoading(true)
    try {
      const latestBlockNumber = await providerZkevm.request({ method: 'eth_blockNumber' });
      setLatestBlockNumber(latestBlockNumber)
    } catch (error) {
      console.log(error)
    }
    finally {
      setIsLoading(false)
    }
}

  async function getChainId() {
  if (!passportInstance || !userInfo.address) return
    setIsLoading(true)
    try {
      const chainId = await providerZkevm.request({ method: 'eth_chainId' });
      setChainId(chainId)
    } catch (error) {
      console.log(error)
    }
    finally {
      setIsLoading(false)
    }
}

async function getTransactionByHash(e) {
    e.preventDefault()
    let hash = e.target.hash.value

  // if (!passportInstance || !userInfo.address) return
    setIsLoading(true)
    if (!hash) {
      // Default hash value if not provided
      hash = "0xa0d300ac90e69f3ba6274ca1a712219951b79ba6c0117f538fe16c016a701951"
    }
    try {
      const transaction = await providerZkevm.request({
  method: 'eth_getTransactionByHash',
  params: [
    hash
  ]
      });
      // Download file into user's machine as trasaction.json
       const blob = new Blob([JSON.stringify(transaction, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'transaction.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
      setTransactionHash(transaction)
    } catch (error) {
      console.log(error)
      alert("Something went wrong. Please try again")
    }
    finally {
      setIsLoading(false)
    }
}

return (
    `<div className="min-w-[400px] max-w-[500px] grid gap-4 py-3 overflow-hidden">`
      `<details open>`
        `<summary className="text-white underline text-xl overflow-x-auto max-w-full mb-4">User Details</summary>`
      `<div className="tokens max-w-[500px]">`
        `<details open className="" ><summary>Id Token</summary>{userInfo.idToken ?? ""}</details>`
        `<details open><summary>Access Token</summary>{userInfo.accessToken ?? ""}</details>`
        `<details ><summary>Nickname</summary>{userInfo.nickname ?? "User has no nickname"}</details>`
      `</div>`
          `</details>`
      `<details>`
      `<summary className="text-white text-xl underline mb-4">`
        {isLoading ?
          `<svg class="animate-spin mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">`
            `<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>`
            `<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>`
          `</svg> : null}`
         Rpc Methods`</summary>`
        `<div className="grid gap-2">`
        `<div  className="flex gap-2">`
          `<button disabled={isLoading} onClick={getGasPrice} className="w-full rounded-full px-3 py-1 bg-green-400 hover:bg-green-500">Get Imx Gas Price</button>`
          `<div className='bg-white w-full rounded-sm py-1 px-2 placeholder:text-gray-800 placeholder:italic'>`
            {gasPrice}
          `</div>`
        `</div>`
        `<div  className="flex gap-2">`
          `<button disabled={isLoading} onClick={getUserBalance} className="w-full rounded-full px-3 py-1 bg-green-400 hover:bg-green-500">Get User Balance</button>`
          `<div className='bg-white w-full rounded-sm py-1 px-2 placeholder:text-gray-800 placeholder:italic'>`
            {userBalance}
          `</div>`
        `</div>`
        `<div  className="flex gap-2">`
          `<button disabled={isLoading} onClick={getLatestBlockNumber} className="w-full rounded-full px-3 py-1 bg-green-400 hover:bg-green-500">`
            Get Latest Block Number
          `</button>`
          `<div className='bg-white w-full rounded-sm py-1 px-2 placeholder:text-gray-800 placeholder:italic'>{latestBlockNumber}</div>`
        `</div>`
        `<div  className="flex gap-2">`
          `<button disabled={isLoading} onClick={getChainId} className="w-full rounded-full px-3 py-1 bg-green-400 hover:bg-green-500">Get Chain Id</button>`
          `<div className='bg-white w-full rounded-sm py-1 px-2 placeholder:text-gray-800 placeholder:italic'>{chainId}</div>`
        `</div>`
         `<form onSubmit={getTransactionByHash} className="px-1">`
          `<p className="mx-auto text-white text-center text-xl mb-2 mt-4">`
            Get Transaction By Hash
          `</p>`
          `<div className="flex gap-4">`
          `<input type="text" placeholder="hash" name="hash" className="w-full px-2 py-2 rounded-xl" />`
          `<button disabled={isLoading} className=" rounded-full px-3 py-1 bg-green-400 hover:bg-green-500">Send</button>`
          `</div>`
        `</form>`
        `<small className="text-gray-300 text-center"><span className="text-green-400">Tip</span>: You can get example hashed from <a className="underline hover:no-underline text-amber-400 italic" href="https://explorer.testnet.immutable.com/txs" target="_blank">Immutable Explorer</a></small>`
`</div>`
      `</details>`
    `</div>`
    )
}
</details>

Fully adding all the RPC functions to the immutable widget. We're now able to call all of them once we've logged in using immutable passport

## Conclusion

We have seen how powerful the Immutable zkEvm passport is and how easy it is to integrate into any application and interact with the blockchain.

Using the techniques provided by this guide, you could build web application ranging from simple to complex and add the passport authentication in just minutes.

## Resources

- The Demp Project Full Source Code - [Github](https://github.com/Complexlity/immutable-planner-app)
- The Demo Project Live - [Immutable Planner App](https://immutable-planner-app.vercel.app)
- The Immutable Passport [Official Documentation](https://docs.immutable.com/docs/zkEVM/products/passport)
- The Writer Of this Awesome Guide - [Complexlity](https://github.com/complexlity)
