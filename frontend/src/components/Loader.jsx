// src/components/Loader.jsx
import React from 'react';

const Loader = () => {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <svg
        className="loader-svg w-full h-full shadow-lg shadow-indigo-600/50 rounded-full p-1"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="1" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FCD34D" stopOpacity="1" />
            <stop offset="100%" stopColor="#EF4444" stopOpacity="1" />
          </linearGradient>
        </defs>

        <circle className="loader-stroke" cx="50" cy="50" r="40" />
      </svg>

      {/* Embedded CSS for the keyframes to keep it self-contained */}
      <style jsx>{`
        .loader-stroke {
          fill: none;
          stroke-width: 8;
          stroke-linecap: round;
          transform-origin: 50% 50%;
          animation: loaderAnimation 6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        .loader-svg {
          transform-origin: 50% 50%;
          animation: continuousSpin 3s linear infinite;
        }

        @keyframes continuousSpin {
          to {
            transform: rotate(1080deg);
          }
        }

        @keyframes loaderAnimation {
          0%, 0.1% {
            stroke-dasharray: 62.5 187.5;
            stroke: url(#grad1);
            transform: rotate(0deg);
          }
          16.6% {
            stroke-dasharray: 87.5 162.5;
            stroke: url(#grad1);
            transform: rotate(180deg);
          }
          33.3% {
            stroke-dasharray: 62.5 187.5;
            stroke: url(#grad1);
            transform: rotate(360deg);
          }
          33.4% {
            stroke-dasharray: 62.5 187.5;
            stroke: url(#grad2);
          }
          50% {
            stroke-dasharray: 87.5 162.5;
            stroke: url(#grad2);
            transform: rotate(540deg);
          }
          66.6% {
            stroke-dasharray: 62.5 187.5;
            stroke: url(#grad2);
            transform: rotate(720deg);
          }
          66.7% {
            stroke-dasharray: 62.5 187.5;
            stroke: url(#grad1);
          }
          83.3% {
            stroke-dasharray: 250 0;
            stroke: url(#grad1);
            transform: rotate(900deg);
          }
          100% {
            stroke-dasharray: 62.5 187.5;
            stroke: url(#grad1);
            transform: rotate(1080deg);
          }
        }
      `}</style>
    </div>
  );
};

export default Loader;