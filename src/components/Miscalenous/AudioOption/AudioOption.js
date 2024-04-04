import {useEffect, useState} from 'react';
import RNPickerSelect from 'react-native-picker-select';
export default function AudioOption({audioDevices}) {
  return (
    <RNPickerSelect
      placeholder={{label: 'Select Microphone', value: ''}}
      onValueChange={value => console.log(value)}
      items={audioDevices}
    />
  );
}
