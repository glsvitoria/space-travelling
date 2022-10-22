import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { GetStaticPaths, GetStaticProps } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { RichText } from 'prismic-dom'
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi'
import Header from '../../components/Header'

import { getPrismicClient } from '../../services/prismic'

import commonStyles from '../../styles/common.module.scss'
import styles from './post.module.scss'

interface Post {
	first_publication_date: string | null
	data: {
		title: string
		banner: {
			url: string
		}
		author: string
		content: {
			heading: string
			body: {
				text: string
			}[]
		}[]
	}
}

interface PostProps {
	post: Post
}

export default function Post({ post }: PostProps) {
	const router = useRouter()

	if (router.isFallback) {
		return <p>Carregando...</p>
	}

	const formattedDate = format(
		new Date(post.first_publication_date),
		'dd MMM yyyy',
		{ locale: ptBR }
	)

   const totalWords = post.data.content.reduce((total, contentItem) => {
      const headingTime = contentItem.heading.split(/\s+/).length
      const wordsTime = RichText.asText(contentItem.body).split(/\s+/).length
      return total + headingTime + wordsTime
   }, 0)

   const readTime = Math.ceil(totalWords / 200)

	return (
		<>
         <Head>
            <title>{post.data.title} | spacetravelling</title>
         </Head>

			<Header />

			<img
				src={post.data.banner.url}
				alt="Banner"
				className={styles.banner}
			/>

			<main className={commonStyles.container}>
				<div>
					<div className={styles.postHeader}>
						<h1>{post.data.title}</h1>
						<ul>
							<li>
								<FiCalendar size={20} /> {formattedDate}
							</li>
							<li>
								<FiUser size={20} /> {post.data.author}
							</li>
							<li>
								<FiClock size={20} /> {readTime} min
							</li>
						</ul>
					</div>

               <div className={styles.postBody}>
                  {post.data.content.map(content => {
                     return (
                        <article key={content.heading}>
                           <h2>{content.heading}</h2>
                           <div dangerouslySetInnerHTML={{
                              __html: RichText.asHtml(content.body)
                           }}></div>
                        </article>
                     )
                  })}
               </div>
				</div>
			</main>
		</>
	)
}

export const getStaticPaths: GetStaticPaths = async () => {
	const prismic = getPrismicClient({})
	const posts = await prismic.getByType('post')

	const paths = posts.results.map((post) => {
		return {
			params: {
				slug: post.uid,
			},
		}
	})

	return {
		paths,
		fallback: true,
	}
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
	const { slug } = params

	const prismic = getPrismicClient({})
	const response = await prismic.getByUID('posts', String(slug))

	return {
		props: {
			post: response,
		},
		revalidate: 60 * 60, // 1h
	}
}
