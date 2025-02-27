"use client";

import { useState, useEffect } from 'react';

/**
 * Custom hook for managing data in localStorage with typed state
 * @param key The localStorage key to store data under
 * @param initialValue The initial value to use if no value is stored
 * @returns A stateful value and a function to update it
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prevValue: T) => T)) => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Initialize on first render only
  useEffect(() => {
    try {
      // Get from local storage by key
      if (typeof window !== 'undefined') { // Only run on client-side
        const item = window.localStorage.getItem(key);
        // Parse stored json or if none return initialValue
        setStoredValue(item ? JSON.parse(item) : initialValue);
      }
    } catch (error) {
      console.log('Error reading from localStorage', error);
      setStoredValue(initialValue);
    }
  }, [key, initialValue]);

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage
  const setValue = (value: T | ((prevValue: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to local storage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.log('Error writing to localStorage', error);
    }
  };

  return [storedValue, setValue];
} 