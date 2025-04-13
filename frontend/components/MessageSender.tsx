import React from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import axios from 'axios';
import Constants from 'expo-constants';

export default function MessageSender({ message, setMessage, setResponse }) {
  const backendUrl = Constants.expoConfig.extra.backendUrl;

  const sendMessage = async () => {
    try {
      const res = await axios.post(`${backendUrl}/echo`, { message });
      setResponse(res.data.response);
    } catch (err) {
      console.error(err);
      setResponse('Error connecting to backend');
    }
  };

  return (
    <View>
      <TextInput
        style={styles.input}
        placeholder="Type your message..."
        onChangeText={setMessage}
        value={message}
      />
      <Button title="Send to AI" onPress={sendMessage} />
    </View>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5 },
});
