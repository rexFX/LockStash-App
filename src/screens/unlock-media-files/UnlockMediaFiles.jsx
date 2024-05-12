import React, { useState } from 'react';
import { SafeAreaView, Text, TextInput, Button, StyleSheet} from 'react-native';
import CryptoJS from 'crypto-es';
import RNSecureStorage from 'rn-secure-storage';
import { CommonActions } from '@react-navigation/native';
import { initialize, set_SERVER } from '../../../redux/features/key-slice';
import { useDispatch, useSelector } from 'react-redux';

const UnlockMediaFiles = ({navigation}) => {
  const is_server = useSelector((state) => state.Info.SERVER);
  const dispatch = useDispatch();
  const [SERVER, setSERVER] = useState(is_server)
  const [error_message, setErrorMessage] = useState('');
  const [Password, setPassword] = useState('');

  const decryptEncryptedKey = () => {
    setErrorMessage('');
    if (Password === '' || SERVER === '') {
      return;
    }

    dispatch(set_SERVER(SERVER));

    RNSecureStorage.getItem('user_data')
      .then((data) => {
        user_data = JSON.parse(data)
        let key = user_data.key;
        try {
          const dkey = CryptoJS.AES.decrypt(key, Password).toString(CryptoJS.enc.Utf8);
          console.log("dkey", dkey);
          dispatch(initialize(dkey));
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
  
        } catch (err) {
          console.log(err);
          console.log('wrong decryption key');
          setErrorMessage('Wrong decryption key')
        }
      })
      .catch((err) => console.log(err.message));
  };

  return (
    <SafeAreaView style={styles.container}>
      {
        is_server == '' && 
        <TextInput
          style={styles.input}
          placeholder="Server"
          value={SERVER}
          onChangeText={setSERVER}
        />
      }
      <TextInput
        style={styles.input}
        placeholder="Enter your media password"
        secureTextEntry
        value={Password}
        onChangeText={setPassword}
      />
      <Button title="Unlock" onPress={decryptEncryptedKey} />

      {
        error_message.length > 0 && <Text style={styles.error}>{error_message}</Text>
      }
    </SafeAreaView>
  );
}

export default UnlockMediaFiles;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  input: {
    width: '80%',
    padding: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 5,
  },
  error: {
    color: 'red',
    marginTop: 10,
  },
});