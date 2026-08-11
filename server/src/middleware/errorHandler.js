export const errorHandler = (err, req, res, next) => {
  console.error(err.stack)

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message)
    return res.status(400).json({ error: errors.join(', ') })
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    return res.status(400).json({ error: `${field} already exists` })
  }

  // Zod validation
  if (err.name === 'ZodError') {
    return res.status(400).json({ error: err.errors[0].message })
  }

  res.status(err.status || 500).json({ error: err.message || 'Internal server error' })
}
