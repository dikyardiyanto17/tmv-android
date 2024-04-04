import { Dimensions, StyleSheet } from 'react-native';
import { RTCView } from 'react-native-webrtc';

export default function ScreenSharing({ stream }) {
    return <RTCView objectFit="contain" streamURL={stream ? stream?.toURL() : null} style={styles.videoContainer} />;
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    videoContainer: {
        width: '100%',
        height: '100%',
        zIndex: 1
    }
});
