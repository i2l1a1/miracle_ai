export type QuestionInnerProps = {
    params: Promise<{
        id: string
    }>
}

export type AnswerType = {
    id?: number
    username: string
    text: string
    rating: number
    is_bot: boolean
    date_added: string
}

export type AnswerListProps = {
    answers: AnswerType[]
}