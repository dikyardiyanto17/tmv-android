import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import unknownImage from '../../../assets/pictures/unknown.jpg';
import Icon from 'react-native-vector-icons/FontAwesome5';

export default function UserList({ userImage, micIcon, cameraIcon, username }) {
    const imageFilter = ({ imgSource }) => {
        try {
            if (imgSource === '/assets/pictures/unknown.jpg' || !imgSource) {
                return unknownImage;
            } else {
                return { uri: imgSource };
            }
        } catch (error) {
            console.log('- Error Filtering Image : ', error);
        }
    };
    return (
        <View style={styles.container}>
            <View style={styles.pictureContainer}>
                <Image source={imageFilter({ imgSource: userImage })} style={styles.picture} />
            </View>
            <View style={styles.usernameContainer}>
                <Text style={styles.username}>{username}</Text>
            </View>
            <View style={styles.iconsContainer}>
                <View style={[styles.iconsCircle, { backgroundColor: micIcon ? 'grey' : 'red' }]}>
                    <Icon name={micIcon ? 'microphone' : 'microphone-slash'} size={15} color="white" light />
                </View>
                <View style={[styles.iconsCircle, { backgroundColor: cameraIcon ? 'grey' : 'red' }]}>
                    <Icon name={cameraIcon ? 'video' : 'video-slash'} size={15} color="white" light />
                </View>
            </View>
        </View>
    );
}
const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
    container: {
        borderWidth: 1,
        borderRadius: 10,
        borderColor: 'white',
        flexDirection: 'row',
        height: 60
    },
    pictureContainer: {
        height: '100%',
        flex: 0.2,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    },
    picture: {
        width: 40,
        aspectRatio: 1,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'white'
    },
    usernameContainer: {
        height: '100%',
        flex: 0.6,
        flexDirection: 'row',
        alignItems: 'center'
    },
    username: {
        marginLeft: 4
    },
    iconsContainer: {
        height: '100%',
        flex: 0.2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        columnGap: 5
    },
    iconsCircle: {
        width: '40%',
        aspectRatio: 1,
        borderRadius: 999,
        backgroundColor: 'grey',
        justifyContent: 'center',
        alignItems: 'center'
    }
});
