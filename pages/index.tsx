import Head from 'next/head'
import { Inter } from 'next/font/google'
import styles from '@/styles/Home.module.css'
import { SearchDialog } from '@/components/SearchDialog'
import Image from 'next/image'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  return (
    <>
      <Head>
        <title>Hyrox Q&A Bot - Get Answers About Hyrox</title>
        <meta
          name="description"
          content="Get instant answers about Hyrox competitions, events, training, and general information from official Hyrox resources."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Hyrox Q&A Bot
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-6 max-w-3xl mx-auto">
            Get instant answers about Hyrox competitions, training, and fitness from official Hyrox information
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-white/90">
            <span className="bg-white/30 px-3 py-1 rounded-full border border-white/40">🏃‍♂️ Competition Info</span>
            <span className="bg-white/30 px-3 py-1 rounded-full border border-white/40">💪 Training Basics</span>
            <span className="bg-white/30 px-3 py-1 rounded-full border border-white/40">📋 Event Details</span>
            <span className="bg-white/30 px-3 py-1 rounded-full border border-white/40">❓ General Questions</span>
          </div>
        </div>

        {/* AI Chat Interface */}
        <div className={styles.center}>
          <SearchDialog />
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12 mb-8">
          <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg p-6 text-center border border-gray-700/50">
            <div className="text-3xl mb-3">🔍</div>
            <h3 className="text-lg font-semibold text-white mb-2">Instant Answers</h3>
            <p className="text-gray-300 text-sm">Get quick responses to your Hyrox questions from official information</p>
          </div>
          <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg p-6 text-center border border-gray-700/50">
            <div className="text-3xl mb-3">📚</div>
            <h3 className="text-lg font-semibold text-white mb-2">Official Information</h3>
            <p className="text-gray-300 text-sm">All answers are based on official Hyrox website content and resources</p>
          </div>
          <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg p-6 text-center border border-gray-700/50">
            <div className="text-3xl mb-3">💬</div>
            <h3 className="text-lg font-semibold text-white mb-2">Easy Q&A</h3>
            <p className="text-gray-300 text-sm">Simply ask questions and get comprehensive answers about Hyrox</p>
          </div>
        </div>

        {/* Footer Links */}
        <div className="py-8 w-full flex items-center justify-center space-x-6">
          <div className="opacity-75 transition hover:opacity-100 cursor-pointer">
            <Link href="https://hyrox.com" className="flex items-center justify-center">
              <p className="text-base mr-2 text-white">Official Hyrox</p>
              <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                <span className="text-black text-xs font-bold">H</span>
              </div>
            </Link>
          </div>
          <div className="border-l border-white/30 w-1 h-4" />
          <div className="flex items-center justify-center space-x-4">
            <div className="opacity-75 transition hover:opacity-100 cursor-pointer">
              <Link
                href="https://github.com/yourusername/hyrox-ai-coach"
                className="flex items-center justify-center"
              >
                <Image src={'/github.svg'} width="20" height="20" alt="Github logo" />
              </Link>
            </div>
            <div className="opacity-75 transition hover:opacity-100 cursor-pointer">
              <Link
                href="https://twitter.com/hyrox"
                className="flex items-center justify-center"
              >
                <Image src={'/twitter.svg'} width="20" height="20" alt="Twitter logo" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
