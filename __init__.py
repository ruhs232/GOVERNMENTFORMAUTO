class RunnablePassthrough:
    """
    A minimal implementation of RunnablePassthrough that
    passes its input through unchanged.
    """
    def __init__(self, *args, **kwargs):
        pass

    def __call__(self, input_value):
        return input_value

    def invoke(self, input_value, **kwargs):
        return self.__call__(input_value)
