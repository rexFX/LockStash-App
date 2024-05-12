import React, { useState } from 'react';
import { SafeAreaView, Text, ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';
import RNFS from 'react-native-fs';
import FileViewer from "react-native-file-viewer";

const Downloads = ({navigation}) => {
  const [files, setFiles] = useState([]);

  React.useEffect(() => {
    RNFS.readDir('/storage/emulated/0/Android/media/com.lockstash_app/')
      .then(result => {
        setFiles(result.map(file => ({ name: file.name, uri: file.path })));
      })
      .catch(err => {
        setErrorMessage(err.message);
      });
  }, []);

  const ViewFile = (file) => {
    FileViewer.open(file.uri)
      .then(() => {
        console.log('File viewed');
      })
      .catch(err => {
        console.log(err.message);
      });
  }

  return (
    <SafeAreaView style={styles.container}>
      {
        files.length > 0 ? (
          <>
            <Text style={styles.info}>
              Tap to view
            </Text>
            <ScrollView style={styles.fileListViewer}>
              {
                files.map((file, index) => {
                  return (
                    <TouchableOpacity style={styles.fileNameTouchableOpacity} key={index} onPress={() => {
                      ViewFile(file)
                    }}>
                      <Text>{file.name}</Text>
                    </TouchableOpacity>
                  )
                })
              }
            </ScrollView>
          </>
        ) : (
          <View style={styles.noFilesView}>
            <Text style={styles.noFilesText}>No files found</Text>
          </View>
        )
      }
    </SafeAreaView>
  );
}

export default Downloads;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileNameTouchableOpacity: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  noFilesView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noFilesText: {
    fontSize: 20,
  },
  fileListViewer: {
    flex: 1,
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: 'gray',
    borderTopWidth: 1,
    borderTopColor: 'gray',
    paddingVertical: 10,
  },
  info: {
    padding: 10,
    textAlign: 'center',
  },
});