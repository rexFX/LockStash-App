import React from 'react';
import { SafeAreaView, ScrollView, Text, StyleSheet, Button, View, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import RNSecureStorage from 'rn-secure-storage';
import RNFS from 'react-native-fs';
import RNFetchBlob from 'rn-fetch-blob';
import DocumentPicker from 'react-native-document-picker';
import CryptoJS from 'crypto-es';
import { v4 as uuidv4 } from 'uuid';
import { Buffer } from 'buffer';
import {
  PermissionsAndroid,
} from "react-native";

const Home = ({navigation}) => {
  const SERVER = useSelector((state) => state.Info.SERVER);
  const key = useSelector((state) => state.Info.decrypted_key);
  const [files, setFiles] = React.useState([]);
  const [email, setEmail] = React.useState('');
  const [downloadStatus, setDownloadStatus] = React.useState('');
  const [uploadStatus, setUploadStatus] = React.useState('');
  const [error_message, setErrorMessage] = React.useState('');

  async function checkAndroidPermission() {
    try {
      const permission = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;
      await PermissionsAndroid.request(permission);
      Promise.resolve();
    } catch (error) {
      Promise.reject(error);
    }
  }

  const filePicker = async () => {
    try {
      const res = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.allFiles],
      });
  
      return res;
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // User cancelled the picker
      } else {
        throw err;
      }
    }
  };

  const fileUploader = async () => {
    setDownloadStatus('');
    setUploadStatus('');
    const file = await filePicker();
    if (file) {
      console.log(file);
      const enc_key = key;

      if (file.size > 50000000) {
        setErrorMessage('File too large, max size is 50MB');
        return;
      }
      
      setUploadStatus('Reading file...');
      await new Promise(resolve => setTimeout(resolve, 0));

      let fileData = ''
      RNFetchBlob.fs.readStream(file.uri, 'base64', 8190000, 10)
      .then((ifstream) => {
        ifstream.open()
        ifstream.onData((chunk) => {
          console.log('ifstream data', chunk)
          fileData += chunk
        })
        ifstream.onError((err) => {
          console.log('ifstream error', err)
        })
        ifstream.onEnd(async () => {
          console.log('ifstream end')
          setUploadStatus('Creating WordArray...');
          await new Promise(resolve => setTimeout(resolve, 0));
          const wordArray = CryptoJS.enc.Base64.parse(fileData);
          setUploadStatus('Encrypting...');
          await new Promise(resolve => setTimeout(resolve, 0));
          const encryptedFile = CryptoJS.AES.encrypt(wordArray, enc_key).toString();
          setUploadStatus('Generating a temporary file...');
          await new Promise(resolve => setTimeout(resolve, 0));
          RNFS.writeFile(`${RNFS.TemporaryDirectoryPath}/encryptedFile.txt`, encryptedFile, 'utf8')
            .then(async () => {
              await new Promise(resolve => setTimeout(resolve, 0));
              console.log('TEMP FILE WRITTEN!');
            })
            .catch((err) => {
              console.log(err.message);
            });
          const fileName = uuidv4();
          const enc_original_name = CryptoJS.AES.encrypt(file.name, enc_key).toString();
  
          setUploadStatus('Uploading...');
          await new Promise(resolve => setTimeout(resolve, 0));

          RNFetchBlob.fetch('POST', `http://${SERVER}/api/upload`, {
            'Content-Type': 'multipart/form-data',
          }, [
            { name: 'email', data: email },
            { name: 'fileName', data: fileName },
            { name: 'enc_original_name', data: enc_original_name },
            { name: 'userFile', filename: fileName, data: RNFetchBlob.wrap(`${RNFS.TemporaryDirectoryPath}/encryptedFile.txt`) },
          ])
          .then((res) => res.json())
          .then((data) => {
              setFiles((files) => [...files, { fileName, enc_original_name }]);
              RNSecureStorage.getItem('user_data')
                .then((data) => {
                  user_data = JSON.parse(data);
                  RNSecureStorage.setItem('user_data', JSON.stringify({
                    ...user_data,
                    files: [...user_data.files, { fileName, enc_original_name }],
                  }))
                    .then(() => {
                      RNFS.unlink(`${RNFS.TemporaryDirectoryPath}/encryptedFile.txt`)
                      .then(() => {
                        console.log('TEMP FILE REMOVED!');
                      })
                      .catch((err) => {
                        RNFS.unlink(`${RNFS.TemporaryDirectoryPath}/encryptedFile.txt`)
                          .then(() => {
                            console.log('TEMP FILE REMOVED!');
                          })
                        console.log(err.message);
                      });
                      setUploadStatus('Uploaded!');
                      setTimeout(() => {
                        setUploadStatus('');
                      }, 5000);
                      console.log('File added to user data')
                    })
                    .catch((err) => {
                      RNFS.unlink(`${RNFS.TemporaryDirectoryPath}/encryptedFile.txt`)
                        .then(() => {
                          console.log('TEMP FILE REMOVED!');
                        })
                      console.log(err.message)
                    });
                })
              console.log(data.message, {
                fileName,
                enc_original_name,
              });
          });
        })
      })
      .catch((err) => {
        console.log(err.message);
        setErrorMessage('Error reading file, it may be too big to store in memory');
        return;
      });
    }
  };

  function convertWordArrayToUint8Array(wordArray) {
    var arrayOfWords = wordArray.hasOwnProperty('words') ? wordArray.words : [];
    var length = wordArray.hasOwnProperty('sigBytes') ? wordArray.sigBytes : arrayOfWords.length * 4;
    var uInt8Array = new Uint8Array(length),
      index = 0,
      word,
      i;
    for (i = 0; i < length; i++) {
      word = arrayOfWords[i];
      uInt8Array[index++] = word >> 24;
      uInt8Array[index++] = (word >> 16) & 0xff;
      uInt8Array[index++] = (word >> 8) & 0xff;
      uInt8Array[index++] = word & 0xff;
    }
    return uInt8Array;
  }

  const handleDownload = async (fileName, origname) => {
    setDownloadStatus('Downloading...');
    const params = new URLSearchParams();
    params.append('email', email);
    params.append('fileName', fileName);
  
    const enc_file = await fetch(`http://${SERVER}/api/download?` + params.toString());
    const enc_file_text = await enc_file.text();
    
    const dec_file = CryptoJS.AES.decrypt(enc_file_text, key);
    const typedArray = convertWordArrayToUint8Array(dec_file);
    const typedArrayBase64 = Buffer.from(typedArray).toString('base64');
  
    const path = "/storage/emulated/0/Android/media/com.lockstash_app/" + origname;
    await checkAndroidPermission().then(() => {
      RNFetchBlob.fs.writeFile(path, typedArrayBase64, 'base64')
        .then(() => {
          console.log('File saved to ', path);
          setDownloadStatus('Downloaded!');
          setTimeout(() => {
            setDownloadStatus('');
          }, 5000);
        })
        .catch((error) => {
          console.error(error);
        });
    })
  };

  const viewDownloads = async () => {
    navigation.navigate('Downloads');
  };

  React.useEffect(() => {}, [uploadStatus]);

  React.useEffect(() => {
    RNSecureStorage.getItem('user_data')
    .then((data) => {
      user_data = JSON.parse(data)
      setFiles(user_data.files);
      setEmail(user_data.email);
    })
    .catch((err) => console.log(err.message));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {
        files.length > 0 ? (
          <>
            <ScrollView style={styles.fileListViewer}>
              {
                files.map((file, index) => {
                  const dec_file = CryptoJS.AES.decrypt(file.enc_original_name, key).toString(CryptoJS.enc.Utf8);
                  return (
                    <TouchableOpacity style={styles.fileNameTouchableOpacity} key={index} onLongPress={() => {
                      handleDownload(file.fileName, dec_file)
                    }}>
                      <Text>{dec_file}</Text>
                    </TouchableOpacity>
                  )
                })
              }
            </ScrollView>
            <Text style={styles.info}>Press and hold to download</Text>
          </>
        ) : (
          <View style={styles.noFilesView}>
              <Text style={styles.noFilesText}>No files found</Text>
          </View>
        )
      }
      <View style={styles.uploadButton}>
        <Button title="Upload File" onPress={fileUploader} />
      </View>
      <View style={styles.ViewDownloadedFiles}>
        <Text style={styles.uploadStatus}>{uploadStatus}</Text>
        <Text style={styles.downloadStatus}>{downloadStatus}</Text>
        <Text style={styles.error}>{error_message}</Text>
        <Button title="View Downloads" onPress={viewDownloads} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileListViewer: {
    flex: 1,
    width: '100%',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'gray',
    borderTopWidth: 1,
    borderTopColor: 'gray',
  },
  uploadButton: {
    width: '100%',
    padding: 40
  },
  noFilesText: {
    fontSize: 20,
    color: 'gray',
    textAlign: 'center',
  },
  noFilesView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileNameTouchableOpacity: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'gray',
  },
  ViewDownloadedFiles: {
    width: '100%',
    padding: 40
  },
  info: {
    textAlign: 'center',
    color: 'gray',
    fontSize: 12,
    marginTop: 10,
  },
  downloadStatus: {
    textAlign: 'center',
    color: 'green',
    fontSize: 15,
    marginBottom: 10,
  },
  uploadStatus: {
    textAlign: 'center',
    color: 'green',
    fontSize: 15,
    marginBottom: 10,
  },
  error: {
    color: 'red',
    marginTop: 10,
  },
});


export default Home;