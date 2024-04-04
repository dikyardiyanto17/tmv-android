import LottieView from 'lottie-react-native';
import { Dimensions, Image, Modal, StyleSheet, Text, View } from 'react-native';
import Cancel from '../../assets/pictures/Cancel.json';
import Icon from 'react-native-vector-icons/FontAwesome5';
export default function WarningModal({ title, message, display }) {
    const { width } = Dimensions.get('window');
    return (
        <Modal visible={display} transparent={true} animationType="fade">
            <View style={styles.warningModalContainer}>
                <View style={styles.warningModal}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.warningTitle}>{title}</Text>
                    </View>
                    <View style={styles.iconContainer}>
                        <LottieView source={Cancel} speed={0.5} autoPlay loop style={{ width: width / 2, aspectRatio: 1 }} />
                    </View>
                    <View style={styles.messageContainer}>
                        <Text style={styles.warningMessage}>{message}</Text>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    warningModalContainer: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center'
    },
    warningModal: {
        width: '90%',
        backgroundColor: 'white',
        flex: 0.5,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20
    },
    titleContainer: {
        flex: 0.2,
        justifyContent: 'center',
        alignItems: 'center'
    },
    iconContainer: {
        flex: 0.5,
        justifyContent: 'center',
        alignItems: 'center'
    },
    messageContainer: {
        flex: 0.3,
        justifyContent: 'center',
        alignItems: 'center'
    },
    warningTitle: {
        color: 'black',
        fontSize: 25
    },
    warningMessage: {
        color: 'black',
        fontSize: 15
    }
});
