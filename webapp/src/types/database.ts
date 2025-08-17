export interface Project {
  id: string
  created_at: string
  user_id: string
  name: string
  brief: string
  keywords?: string
  emotion?: string
  look_and_feel?: string
  combined_metadata?: string
  combined_vector?: number[]
}

export interface Asset {
  id: string
  created_at: string
  user_id: string
  project_id?: string
  filename: string
  file_url: string
  file_type: string
  keywords?: string
  emotion?: string
  look_and_feel?: string
  combined_metadata?: string
  combined_vector?: number[]
  tags?: string[]
  is_public: boolean
}

export interface User {
  id: string
  email: string
  name?: string
  role?: string
}

export interface CreateProjectRequest {
  name: string
  brief: string
  userEmail: string
}

export interface CreateAssetRequest {
  keywords?: string
  emotion?: string
  lookAndFeel?: string
  userEmail: string
  imageFile: File
}

export interface ApiResponse<T> {
  success?: boolean
  error?: string
  message?: string
  project?: T
  asset?: T
  projects?: T[]
  assets?: T[]
}
