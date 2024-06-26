import React, {useState} from 'react';
import {
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  View,
} from 'react-native';
import { set_SERVER } from '../../../redux/features/key-slice';

import RNSecureStorage, {ACCESSIBLE} from 'rn-secure-storage';

import * as srp from 'secure-remote-password/client';
import CryptoJS from 'crypto-es';

import { useDispatch } from 'react-redux';

const Login = ({navigation}) => {
  const dispatch = useDispatch();
  const [SERVER, setSERVER] = useState('')
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error_message, setErrorMessage] = useState('');
  const [success_message, setSuccessMessage] = useState('');

  const handleLogin = async () => {
    if (email === '' || password === '' || SERVER === '') {
      return;
    }

    dispatch(set_SERVER(SERVER));

    setErrorMessage('');
    setSuccessMessage('Logging in..');
    await new Promise(resolve => setTimeout(resolve, 0));

    try {
      let user = null;

      setSuccessMessage('Fetching user..');
      await new Promise(resolve => setTimeout(resolve, 0));
      let resp = await fetch(`http://${SERVER}/api/login`, {
        method: 'POST',
        body: JSON.stringify({email: email}),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      resp = await resp.json();

      const {salt, serverEphemeral} = resp;

      setSuccessMessage('Generating ephemerals..');
      await new Promise(resolve => setTimeout(resolve, 0));
      const clientEphemeral = srp.generateEphemeral();

      setSuccessMessage('Generating privateKey..');
      await new Promise(resolve => setTimeout(resolve, 0));
      const privateKey = CryptoJS.PBKDF2(salt + password + email + salt, salt, {
        keySize: 256 / 32,
        iterations: 50, // Can keep more iterations but it will take more time
      }).toString();

      setSuccessMessage('Deriving session..');
      await new Promise(resolve => setTimeout(resolve, 0));

      const clientSession = srp.deriveSession(
        clientEphemeral.secret,
        serverEphemeral,
        salt,
        email,
        privateKey,
      );

      console.log("email:", email);
      let res = await fetch(`http://${SERVER}/api/loginWithProof`, {
        method: 'POST',
        body: JSON.stringify({
          email: email,
          clientEphemeral: clientEphemeral.public,
          clientProof: clientSession.proof,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      res = await res.json();
      const {serverProof, key, files, mediaPassword} = res;
      console.log("res:", res);

      setSuccessMessage('Verifying session..');
      await new Promise(resolve => setTimeout(resolve, 0));

      srp.verifySession(clientEphemeral.public, clientSession, serverProof);
      user = {"email": email, "key": key, "files": files, "mediaPassword": mediaPassword};

      console.log(user);

      RNSecureStorage.setItem("user_data", JSON.stringify(user), {accessible: ACCESSIBLE.WHEN_UNLOCKED})

      if (user.mediaPassword === true) {
        navigation.navigate('UnlockMediaFiles');
      }
      else {
        navigation.navigate('AddMediaPassword');
      }
    } catch (err) {
      console.log("Email or Password is not correct");
      setSuccessMessage('');
      setErrorMessage("Email or Password is not correct");
      return null;
    }
  };

  const handleSignup = async () => {
    setErrorMessage('');
    if (email === '' || password === '' || SERVER === '') {
      return;
    }

    dispatch(set_SERVER(SERVER));

    setSuccessMessage('Generating salt..');
    await new Promise(resolve => setTimeout(resolve, 0));

    const salt = srp.generateSalt();

    setSuccessMessage('Generating privateKey..');
    await new Promise(resolve => setTimeout(resolve, 0));
    const privateKey = CryptoJS.PBKDF2(salt + password + email + salt, salt, {
      keySize: 256 / 32,
      iterations: 50,
    }).toString();

    console.log(privateKey);

    setSuccessMessage('Generating verifier..');
    await new Promise(resolve => setTimeout(resolve, 0));
    const verifier = srp.deriveVerifier(privateKey);
    fetch(`http://${SERVER}/api/signup`, {
      method: 'POST',
      body: JSON.stringify({email, salt, verifier}),
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(resp => resp.json())
      .then(resp => {
        setSuccessMessage(resp.message);
        console.log(resp.message);
      })
      .catch(err => {
        console.log(err.message)
        setSuccessMessage('');
        setErrorMessage(err.message);
      });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>LockStash</Text>
      <TextInput
        style={styles.input}
        placeholder="Server"
        value={SERVER}
        placeholderTextColor="#000"
        onChangeText={setSERVER}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#000"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        placeholderTextColor="#000"
        value={password}
        onChangeText={setPassword}
      />
      {success_message.length > 0 && (
        <Text style={styles.registrationSuccessText}>{success_message}</Text>
      )}

      {
        error_message.length > 0 && (
          <Text style={styles.errorText}>{error_message}</Text>
        )
      }

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleSignup}>
          <Text style={styles.buttonText}>Signup</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 20,
  },
  input: {
    color: 'black',
    width: '80%',
    height: 40,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: 'blue',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '60%',
    marginTop: 20,
  },
  registrationSuccessText: {
    color: 'green',
    fontSize: 16,
    marginTop: 10,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginTop: 10,
  },
});
