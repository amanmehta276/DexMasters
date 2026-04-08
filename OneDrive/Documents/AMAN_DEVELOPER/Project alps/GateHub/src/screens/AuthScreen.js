// src/screens/AuthScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { apiLogin, apiRegister } from '../api';

export default function AuthScreen({ navigation }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useApp();

  const onSubmit = async () => {
    if (!email.trim() || !password.trim() || (!isLogin && !name.trim())) {
      return Alert.alert('Required', 'Fill all fields first.');
    }

    setLoading(true);
    try {
      const data = isLogin
        ? await apiLogin(email.trim(), password)
        : await apiRegister(name.trim(), email.trim(), password);

      await login(data.user, data.token);
      Alert.alert('Success', `${isLogin ? 'Logged in' : 'Registered'} successfully`);
      navigation.navigate('Home');
    } catch (err) {
      Alert.alert('Error', err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GateHub</Text>
      <Text style={styles.subtitle}>Access all engineering resources</Text>

      {!isLogin && (
        <TextInput
          style={styles.input}
          placeholder="Name"
          placeholderTextColor="#94a3b8"
          value={name}
          onChangeText={setName}
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#94a3b8"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#94a3b8"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.submitBtn} onPress={onSubmit} disabled={loading}>
        <Text style={styles.submitText}>{loading ? 'Please wait...' : isLogin ? 'Login' : 'Register'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
        <Text style={styles.toggleText}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '} 
          <Text style={styles.toggleAction}>{isLogin ? 'Register' : 'Login'}</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', padding: 24 },
  title: { fontSize: 34, fontWeight: '900', color: '#0f172a', marginBottom: 4 },
  subtitle: { color: '#64748b', fontSize: 14, marginBottom: 26 },
  input: { backgroundColor: '#fff', borderColor: '#cbd5e1', borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12, color: '#0f172a' },
  submitBtn: { backgroundColor: '#6366f1', borderRadius: 14, paddingVertical: 14, marginTop: 10, alignItems: 'center' },
  submitText: { color: '#ffffff', fontWeight: '800' },
  toggleText: { marginTop: 18, color: '#64748b', textAlign: 'center' },
  toggleAction: { color: '#4f46e5', fontWeight: '800' },
});