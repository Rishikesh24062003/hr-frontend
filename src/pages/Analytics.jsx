import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import axios from 'axios';

const UPLOAD_THROTTLE_MS = 2000; // 1 second between calls
let lastUploadTime = 0;

export default function Analytics() {
  const [stats, setStats] = useState({ resumes: 0, jobs: 0, rankings: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [llmProcessing, setLlmProcessing] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [llmResult, setLlmResult] = useState(null);
  const [processingStatus, setProcessingStatus] = useState('');
  const [activeTab, setActiveTab] = useState('analytics');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/analytics/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error.message);
    }
    setLoading(false);
  };

  const handleFileUpload = async (event) => {
    // Throttle uploads
    const now = Date.now();
    if (now - lastUploadTime < UPLOAD_THROTTLE_MS) {
      setProcessingStatus('Please wait 2 seconds before retrying.');
      return;
    }
    lastUploadTime = now;

    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    if (!allowedTypes.includes(file.type)) {
      setProcessingStatus('Error: Please upload a PDF or Word document');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setProcessingStatus('Error: File size too large. Please use a file smaller than 10MB');
      return;
    }

    setSelectedFile(file);
    setLlmProcessing(true);
    setProcessingStatus('Uploading and extracting text...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await api.post('/resumes/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const resumeData = uploadResponse.data.resume;
      if (!resumeData.raw_text || !resumeData.raw_text.trim()) {
        setProcessingStatus('Error: Could not extract text from resume. The file may be corrupted, encrypted, or contain only images.');
        setLlmProcessing(false);
        return;
      }

      setProcessingStatus('Processing with LLM...');
      try {
        const llmResponse = await api.post('/llm/parse-resume', {
          resume_text: resumeData.raw_text
        });

        setParsedData(llmResponse.data.parsed);
        setLlmResult({
          resumeId: resumeData.id,
          originalData: resumeData,
          llmParsed: llmResponse.data.parsed,
          filename: file.name,
          processingTime: new Date().toISOString()
        });
        setProcessingStatus('LLM processing complete!');
      } catch (llmError) {
        console.warn('LLM processing failed, continuing without LLM:', llmError);
        setProcessingStatus('File uploaded successfully! (LLM processing skipped)');
        setLlmResult({
          resumeId: resumeData.id,
          originalData: resumeData,
          llmParsed: null,
          filename: file.name,
          processingTime: new Date().toISOString()
        });
      }

      // If LLM processing was successful, try to match with jobs
      if (llmResult?.llmParsed) {
        try {
          setProcessingStatus('Matching with job profiles...');
          const matchResponse = await api.post('/llm/match-jobs', {
            parsed_resume: llmResult.llmParsed
          });
          
          setLlmResult(prev => ({
            ...prev,
            jobMatches: matchResponse.data.matches,
            topRecommendations: matchResponse.data.top_recommendations
          }));
          setProcessingStatus('Job matching complete!');
        } catch (matchError) {
          console.warn('Job matching failed:', matchError);
          setProcessingStatus('LLM processing complete! (Job matching skipped)');
        }
      }
    } catch (error) {
      console.error('Processing failed:', error.message);
      if (error.response?.status === 400) {
        setProcessingStatus(error.response.data.error || 'Error: Could not process resume');
      } else if (error.response?.status === 413) {
        setProcessingStatus('Error: File too large');
      } else if (error.response?.status === 429) {
        setProcessingStatus('Error: Rate limit exceeded. Please wait and try again.');
      } else {
        setProcessingStatus('Error: Processing failed. Please try a different file or contact support.');
      }
    }

    setLlmProcessing(false);
  };

  const runLlmRanking = async () => {
    if (!llmResult?.llmParsed) return;

    setLlmProcessing(true);
    setProcessingStatus('Running LLM-powered ranking...');

    try {
      const jobsResponse = await api.get('/jobs/');
      const jobs = jobsResponse.data.jobs || [];
      if (!jobs.length) {
        setProcessingStatus('No jobs available for ranking');
        setLlmProcessing(false);
        return;
      }

      const job = jobs[0];
      const jobDescription = `${job.title}\n${job.description}\nRequired Skills: ${job.requirements?.skills?.join(', ') || 'Not specified'}`;

      const rankingResponse = await api.post('/llm/rank-candidate', {
        resume: llmResult.llmParsed,
        job: jobDescription
      });

      setLlmResult(prev => ({
        ...prev,
        ranking: rankingResponse.data,
        jobMatched: job
      }));
      setProcessingStatus('LLM ranking complete!');
    } catch (error) {
      console.error('LLM ranking failed:', error);
      setProcessingStatus('Error running LLM ranking');
    }

    setLlmProcessing(false);
  };

  const clearLlmData = () => {
    setSelectedFile(null);
    setParsedData(null);
    setLlmResult(null);
    setProcessingStatus('');
    document.getElementById('llm-file-input').value = '';
  };

  if (loading) {
    return <div className="p-4">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Analytics & AI Tools</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              activeTab === 'analytics'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('llm')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              activeTab === 'llm'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            LLM Tools
          </button>
        </div>
      </div>

      {activeTab === 'analytics' ? (
        <>
          {/* Analytics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard icon="📄" label="Total Resumes" value={stats.resumes} color="bg-blue-500" />
            <StatCard icon="💼" label="Active Jobs" value={stats.jobs} color="bg-green-500" />
            <StatCard icon="⭐" label="Total Rankings" value={stats.rankings} color="bg-yellow-500" />
          </div>
          {/* Pipeline Overview */}
          <PipelineOverview stats={stats} />
        </>
      ) : (
        <>
          {/* LLM Tools Section */}
          <LLMTools
            selectedFile={selectedFile}
            llmProcessing={llmProcessing}
            processingStatus={processingStatus}
            parsedData={parsedData}
            llmResult={llmResult}
            handleFileUpload={handleFileUpload}
            runLlmRanking={runLlmRanking}
            clearLlmData={clearLlmData}
          />
        </>
      )}
    </div>
  );
}

// Helper components for clarity
function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5 flex items-center">
        <div className={`w-8 h-8 ${color} rounded-md flex items-center justify-center`}>
          <span className="text-white text-sm">{icon}</span>
        </div>
        <div className="ml-5">
          <dt className="text-sm font-medium text-gray-500 truncate">{label}</dt>
          <dd className="text-lg font-medium text-gray-900">{value}</dd>
        </div>
      </div>
    </div>
  );
}

function PipelineOverview({ stats }) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900">Hiring Pipeline Overview</h3>
      <ul className="mt-4 space-y-4">
        <PipelineStep number="1" color="bg-blue-500" label={`Resume Collection: ${stats.resumes} resumes`} />
        <PipelineStep number="2" color="bg-green-500" label={`Job Postings: ${stats.jobs} active positions`} />
        <PipelineStep number="3" color="bg-yellow-500" label={`AI Rankings: ${stats.rankings} completed`} />
      </ul>
    </div>
  );
}

function PipelineStep({ number, color, label }) {
  return (
    <li className="flex items-center">
      <div className={`${color} text-white rounded-full w-8 h-8 flex items-center justify-center`}>{number}</div>
      <span className="ml-4 text-gray-700">{label}</span>
    </li>
  );
}

function LLMTools({
  selectedFile, llmProcessing, processingStatus, parsedData, llmResult,
  handleFileUpload, runLlmRanking, clearLlmData
}) {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <ToolHeader />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <UploadSection
            selectedFile={selectedFile}
            llmProcessing={llmProcessing}
            processingStatus={processingStatus}
            handleFileUpload={handleFileUpload}
            clearLlmData={clearLlmData}
          />
          <ResultsSection
            parsedData={parsedData}
            llmResult={llmResult}
            llmProcessing={llmProcessing}
            runLlmRanking={runLlmRanking}
          />
        </div>
      </div>
      <FeaturesOverview />
    </div>
  );
}

function ToolHeader() {
  return (
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-medium text-gray-900">🤖 LLM-Powered Resume Processing</h3>
      <div className="space-x-2">
        <Badge color="green" text="AI-Powered" />
        <Badge color="blue" text="OpenAI GPT" />
      </div>
    </div>
  );
}

function Badge({ color, text }) {
  const bg = color === 'green' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';
  return <span className={`${bg} px-2 py-0.5 text-xs rounded-full`}>{text}</span>;
}

function UploadSection({ selectedFile, llmProcessing, processingStatus, handleFileUpload, clearLlmData }) {
  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-gray-400">
        <label htmlFor="llm-file-input" className="flex flex-col items-center cursor-pointer">
          <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-sm text-gray-600">Upload a resume (PDF, DOC, DOCX)</span>
          <input
            id="llm-file-input"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileUpload}
            className="sr-only"
            disabled={llmProcessing}
          />
        </label>
      </div>

      {selectedFile && (
        <div className="flex items-center bg-gray-50 p-4 rounded-lg">
          <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <div className="ml-4 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
            <p className="text-sm text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
          <button onClick={clearLlmData} disabled={llmProcessing} className="text-gray-400 hover:text-gray-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      )}

      {processingStatus && (
        <div className="flex items-center bg-blue-50 p-4 rounded-lg border border-blue-200">
          {llmProcessing && <svg className="animate-spin h-5 w-5 text-blue-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291C8.042 17.958 10.824 19.093 13.938 21l1.646-3z"/>
          </svg>}
          <p className="text-sm text-blue-800">{processingStatus}</p>
        </div>
      )}
    </div>
  );
}

function ResultsSection({ parsedData, llmResult, llmProcessing, runLlmRanking }) {
  return (
    <div className="space-y-4">
      {parsedData && (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h4 className="text-sm font-medium text-green-800 mb-2">✨ LLM Extracted Data</h4>
          <div className="text-sm space-y-1">
            {parsedData.name && <div><strong>Name:</strong> {parsedData.name}</div>}
            {parsedData.email && <div><strong>Email:</strong> {parsedData.email}</div>}
            {parsedData.phone && <div><strong>Phone:</strong> {parsedData.phone}</div>}
            {parsedData.skills?.length > 0 && (
              <div>
                <strong>Skills:</strong>
                <div className="mt-1 flex flex-wrap gap-1">
                  {parsedData.skills.map((skill, idx) => (
                    <span key={idx} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">{skill}</span>
                  ))}
                </div>
              </div>
            )}
            {parsedData.experience_years != null && (
              <div><strong>Experience:</strong> {parsedData.experience_years} years</div>
            )}
          </div>
        </div>
      )}

      {llmResult && !llmResult.ranking && (
        <button
          onClick={runLlmRanking}
          disabled={llmProcessing}
          className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {llmProcessing ? 'Processing...' : '🎯 Run LLM Job Matching'}
        </button>
      )}

      {llmResult?.ranking && (
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">🎯 LLM Job Match Score</h4>
          <div className="text-sm space-y-1">  
            <div className="flex justify-between"><strong>Score:</strong> <span>{llmResult.ranking.score}/10</span></div>
            {llmResult.jobMatched && <div><strong>Job:</strong> {llmResult.jobMatched.title}</div>}
            {llmResult.ranking.rationale && (
              <div><strong>AI Analysis:</strong><p className="mt-1 text-gray-700">{llmResult.ranking.rationale}</p></div>
            )}
          </div>
        </div>
      )}

      {/* Job Matches Section */}
      {llmResult?.jobMatches && llmResult.jobMatches.length > 0 && (
        <div className="space-y-4">
          {/* Top Recommendations */}
          {llmResult.topRecommendations && llmResult.topRecommendations.length > 0 && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="text-sm font-medium text-green-800 mb-3">🏆 Top Job Recommendations</h4>
              <div className="space-y-2">
                {llmResult.topRecommendations.slice(0, 3).map((rec, index) => (
                  <div key={rec.job_id} className="bg-white rounded p-3 border border-green-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <h6 className="font-medium text-green-800">{rec.job_title}</h6>
                        <p className="text-sm text-green-600">Match Score: {rec.match_score}/10</p>
                      </div>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                        #{index + 1}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* All Matches */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-800 mb-3">📋 All Job Matches</h4>
            <div className="space-y-3">
              {llmResult.jobMatches.map((match) => (
                <div key={match.job_id} className="bg-white rounded p-3 border border-blue-100">
                  <div className="flex justify-between items-start mb-2">
                    <h6 className="font-medium text-blue-800">{match.job_title}</h6>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {match.match_score}/10
                    </span>
                  </div>
                  <p className="text-sm text-blue-700">{match.reasoning}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FeaturesOverview() {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">🚀 Available LLM Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Feature icon="🧠" title="Smart Resume Parsing" desc="AI extracts name, email, phone, skills, education, and experience with high accuracy" color="purple" />
          <Feature icon="🎯" title="Intelligent Job Matching" desc="LLM analyzes candidate fit for specific roles with detailed explanations" color="green" />
          <Feature icon="📊" title="Context-Aware Analysis" desc="Understanding nuanced resume formats and industry-specific terminology" color="blue" />
          <Feature icon="⚡" title="Real-time Processing" desc="Instant resume analysis and scoring with OpenAI's latest models" color="red" />
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, desc, color }) {
  const bg = {
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    red: 'bg-red-500'
  }[color];
  return (
    <div className="flex items-start space-x-3">
      <div className={`flex-shrink-0 ${bg} w-8 h-8 rounded-md flex items-center justify-center`}>
        <span className="text-white text-sm">{icon}</span>
      </div>
      <div>
        <h4 className="text-sm font-medium text-gray-900">{title}</h4>
        <p className="text-sm text-gray-500 mt-1">{desc}</p>
      </div>
    </div>
  );
}
