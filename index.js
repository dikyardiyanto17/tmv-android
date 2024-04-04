/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import notifee, { AndroidImportance } from '@notifee/react-native';
notifee.registerForegroundService(notification => {
    return new Promise(() => {
        // notifee.onForegroundEvent(({ type, detail }) => {
        //     console.log('- Type : ', type, '- Detail : ', detail);
        //     if (type === EventType.ACTION_PRESS && detail.pressAction.id === 'stop') {
        //       await notifee.stopForegroundService()
        //     }
        // });
    });
});

AppRegistry.registerComponent(appName, () => App);
