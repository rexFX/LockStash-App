import React from 'react';
import {NavigationContainer, useNavigation, CommonActions} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Login from './src/screens/login/login';
import Home from './src/screens/home/Home';
import AddMediaPassword from './src/screens/add-media-password/AddMediaPassword';
import UnlockMediaFiles from './src/screens/unlock-media-files/UnlockMediaFiles';
import Downloads from './src/screens/downloads/Downloads';


import RNSecureStorage from 'rn-secure-storage';
import ReduxProvider from './redux/provider';
import { Button } from 'react-native';
import { useDispatch } from 'react-redux';
import { clear } from './redux/features/key-slice';

const Stack = createNativeStackNavigator();

const App = () => {
  const [initialRouteName, setInitialRouteName] = React.useState('');

  React.useEffect(() => {
    RNSecureStorage.exist('user_data')
      .then((data) => {
        if (data === true) {
          setInitialRouteName('UnlockMediaFiles');
        } else {
          setInitialRouteName('Login');
        }
      })
      .catch((err) => console.log(err.message));
  }, []);

  if (initialRouteName === '') {
    return null;
  }

  return (
    <ReduxProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName={initialRouteName}>
          <Stack.Screen name="Login" component={Login} options={
            {title: "Login to LockStash"}
          } />
          <Stack.Screen name="Home" component={Home} options={
            {
              headerRight: () => {
                const navigation = useNavigation();
                const dispatch = useDispatch();

                return (
                  <Button
                    onPress={() => {
                      RNSecureStorage.removeItem("user_data")
                        .then(() => console.log("User data removed"))
                        .catch((err) => console.log(err.message));
                      
                      dispatch(clear())

                      navigation.dispatch(
                        CommonActions.reset({
                          index: 0,
                          routes: [
                            {
                              name: 'Login',
                            }
                          ],
                        })
                      );
                    }}
                    title="Logout"
                    color="black"
                  />
                )
              },
            }
          }/>
          <Stack.Screen name="AddMediaPassword" component={AddMediaPassword} options={
            {
              title: "Add Media Password",
              headerRight: () => {
                const navigation = useNavigation();
                const dispatch = useDispatch();

                return (
                  <Button
                    onPress={() => {
                      RNSecureStorage.removeItem("user_data")
                        .then(() => console.log("User data removed"))
                        .catch((err) => console.log(err.message));
                      
                      dispatch(clear())

                      navigation.dispatch(
                        CommonActions.reset({
                          index: 0,
                          routes: [
                            {
                              name: 'Login',
                            }
                          ],
                        })
                      );
                    }}
                    title="Logout"
                    color="black"
                  />
                )
              },
            }
          } />
          <Stack.Screen name="UnlockMediaFiles" component={UnlockMediaFiles} options={
            {
              title: "Unlock Media Files",
              headerRight: () => {
                const navigation = useNavigation();
                const dispatch = useDispatch();

                return (
                  <Button
                    onPress={() => {
                      RNSecureStorage.removeItem("user_data")
                        .then(() => console.log("User data removed"))
                        .catch((err) => console.log(err.message));
                      
                      dispatch(clear())

                      navigation.dispatch(
                        CommonActions.reset({
                          index: 0,
                          routes: [
                            {
                              name: 'Login',
                            }
                          ],
                        })
                      );
                    }}
                    title="Logout"
                    color="black"
                  />
                )
              },
            }
          }/>
          <Stack.Screen name="Downloads" component={Downloads} options={
            {title: "Downloads"}
          } />
        </Stack.Navigator>
      </NavigationContainer>
    </ReduxProvider>
  );
};

export default App;
