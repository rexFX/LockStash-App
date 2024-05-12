import React from 'react';
import {SafeAreaView, Text, TextInput, Button, StyleSheet} from 'react-native';
import CryptoJS from 'crypto-es';
import RNSecureStorage from 'rn-secure-storage';
import * as srp from 'secure-remote-password/client';
import { CommonActions } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { initialize } from '../../../redux/features/key-slice';

const AddMediaPassword = ({navigation}) => {
  const SERVER = useSelector((state) => state.Info.SERVER);
  const dispatch = useDispatch();
  const [Password, setPassword] = React.useState('');
  const [confirm_password, setConfirmPassword] = React.useState('');
  const [error_message, setErrorMessage] = React.useState('');

  const AddEncryptedKey = () => {
    setErrorMessage('');

    if (Password !== confirm_password) {
      setErrorMessage('Passwords do not match');
      return;
    }

    if (Password.length > 0) {
      RNSecureStorage.getItem('user_data')
        .then((data) => {
          user_data = JSON.parse(data)

          const email = user_data.email;
          const dec_key = CryptoJS.PBKDF2(srp.generateSalt(), srp.generateSalt(), {
            keySize: 256 / 32,
            iterations: 100,
          }).toString();
          console.log("dec", dec_key);
          const encryptedKey = CryptoJS.AES.encrypt(dec_key, Password).toString();
          console.log(encryptedKey);
          const decryptedKey = CryptoJS.AES.decrypt(encryptedKey, Password).toString(CryptoJS.enc.Utf8);
          console.log(decryptedKey);

          fetch(`http://${SERVER}/api/setEncryptedKey`, {
            method: 'POST',
            body: JSON.stringify({ email, encryptedKey }),
            headers: {
              'Content-Type': 'application/json',
            },
          })
            .then((resp) => resp.json())
            .then((resp) => {
              console.log(resp.message);
              console.log(JSON.stringify({
                ...user_data,
                "mediaPassword": true,
              }));

              RNSecureStorage.setItem('user_data', JSON.stringify({
                ...user_data,
                key: encryptedKey,
                "mediaPassword": true,
              }))
                .then(() => console.log('Media Password Set'))
                .catch((err) => console.log(err.message));

              
              dispatch(initialize(dec_key));
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [
                    {
                      name: 'Home',
                    }
                  ],
                })
              );
            })
            .catch((err) => {
              console.log(err.message);
              setErrorMessage('Error setting media password');
            });
        })
        .catch((err) => console.log(err.message));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Media Password"
        secureTextEntry
        value={Password}
        placeholderTextColor="#000"
        onChangeText={setPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Media Password"
        secureTextEntry
        placeholderTextColor="#000"
        value={confirm_password}
        onChangeText={setConfirmPassword}
      />
      <Button title="Submit" onPress={AddEncryptedKey} />

      {
        error_message.length > 0 && <Text style={styles.error}>{error_message}</Text>
      }
    </SafeAreaView>
  );
}

export default AddMediaPassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    color: 'black',
  },
  input: {
    borderWidth: 1,
    borderColor: 'black',
    width: '80%',
    padding: 10,
    marginBottom: 20,
    color: 'black',
  },
  error: {
    color: 'red',
    marginBottom: 20,
  },
});