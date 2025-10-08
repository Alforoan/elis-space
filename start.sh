#!/bin/bash

cd backend && python main.py &
BACKEND_PID=$!

sleep 3

cd .. && npm run dev &
FRONTEND_PID=$!

wait $BACKEND_PID $FRONTEND_PID
