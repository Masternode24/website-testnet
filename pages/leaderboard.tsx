import { useEffect, useState } from 'react'
import clsx from 'clsx'
import Head from 'next/head'
import Link from 'next/link'

import Footer from 'components/Footer'
import Navbar from 'components/Navbar'
import Search from 'components/icons/Search'
import BackToTop from 'components/BackToTop'
import { Select } from 'components/Form/Select'
import PageBanner from 'components/PageBanner'
import { Toast, Alignment } from 'components/Toast'
import NoResults from 'components/leaderboard/ImageNoResults'
import LeaderboardRow from 'components/leaderboard/LeaderboardRow'
import Loader from 'components/Loader'
import PaginationButton from 'components/PaginationButton'

import { countries, CountryWithCode } from 'data/countries'
import { defaultErrorText } from 'utils/forms'
import useDebounce from 'hooks/useDebounce'
import { LoginContext } from 'hooks/useLogin'
import { useField } from 'hooks/useForm'
import { useQueriedToast } from 'hooks/useToast'
import { usePaginatedUsers } from 'hooks/usePaginatedUsers'

import * as API from 'apiClient'

type Props = {
  showNotification: boolean
  loginContext: LoginContext
}

const TOTAL_POINTS = 'Total Points'

const FIELDS = {
  country: {
    id: 'country',
    label: 'Country',
    options: countries.map(({ code, name }: CountryWithCode) => ({
      name,
      value: code,
    })),
    validation: () => true,
    defaultErrorText,
    useDefault: true,
    defaultValue: 'Global',
    defaultLabel: 'Global',
  },
  eventType: {
    id: 'eventType',
    label: 'eventType',
    options: [
      { name: 'Hosting a Node', value: API.EventType.NODE_HOSTED },
      { name: 'Bugs Found', value: API.EventType.BUG_CAUGHT },
      { name: 'Transactions Sent', value: API.EventType.TRANSACTION_SENT },
      { name: 'Pull Requests', value: API.EventType.PULL_REQUEST_MERGED },
    ],
    validation: () => true,
    defaultErrorText,
    useDefault: true,
    defaultValue: TOTAL_POINTS,
    defaultLabel: TOTAL_POINTS,
  },
}

const PAGINATION_LIMIT = 25

export default function Leaderboard({ showNotification, loginContext }: Props) {
  const { visible: $visible, message: $toast } = useQueriedToast({
    queryString: 'toast',
    duration: 8e3,
  })

  const $country = useField(FIELDS.country)
  const $eventType = useField(FIELDS.eventType)
  const [$userList, $setUserList] = useState<
    API.PaginatedListLeaderboardResponse | undefined
  >()

  // Search field hooks
  const [$search, $setSearch] = useState('')
  const $debouncedSearch = useDebounce($search, 300)
  const [$searching, $setSearching] = useState(false)
  const countryValue = $country?.value
  const eventTypeValue = $eventType?.value

  useEffect(() => {
    const func = async () => {
      $setSearching(true)

      const countrySearch =
        countryValue !== 'Global' ? { country_code: countryValue } : {}

      const eventType =
        eventTypeValue !== TOTAL_POINTS ? { event_type: eventTypeValue } : {}

      const result = await API.listUsers({
        limit: PAGINATION_LIMIT,
        search: $debouncedSearch,
        ...countrySearch,
        ...eventType,
      })

      if (!('error' in result)) {
        $setUserList(result)
      }

      $setSearching(false)
    }

    if (countryValue && eventTypeValue) {
      func()
    }
  }, [$debouncedSearch, countryValue, eventTypeValue])

  const { checkLoggedIn, checkLoading } = loginContext
  const isLoggedIn = checkLoggedIn()
  const isLoading = checkLoading()

  const { fetchPrevious, fetchNext, $hasPrevious, $hasNext } =
    usePaginatedUsers(
      PAGINATION_LIMIT,
      $search,
      $eventType?.value || '',
      $country?.value || '',
      $userList,
      $setUserList
    )
  const users = $userList?.data || []

  return isLoading ? (
    <Loader />
  ) : (
    <div className={clsx('min-h-screen', 'flex', 'flex-col', 'font-favorit')}>
      <Head>
        <title>Leaderboard</title>
        <meta name="description" content="Leaderboard" />
      </Head>
      <Toast
        showNotification={showNotification}
        message={$toast}
        visible={$visible}
        alignment={Alignment.Top}
      />
      <Navbar
        showNotification={showNotification}
        fill="black"
        className={clsx('bg-ifpink', 'text-black')}
        loginContext={loginContext}
      />
      <BackToTop />
      <main
        className={clsx(
          'bg-ifpink',
          'flex-1',
          'items-center',
          'flex',
          'flex-col'
        )}
      >
        <PageBanner
          title={
            <>
              Testnet Leaderboard
              <br />
              Phase 2.
            </>
          }
          text={
            <p>
              Our incentivized testnet leaderboard shows you who the top point
              getters are for all-time score, miners, bug catchers, net
              promoters, node hosting and more! Click a user name to see a
              breakdown of their activity.{' '}
              <Link
                href="https://phase1.testnet.ironfish.network/leaderboard"
                passHref
              >
                <a className="border-b border-black">
                  View Phase 1 leaderboard
                </a>
              </Link>
            </p>
          }
          buttonText={!isLoggedIn ? 'Sign Up' : undefined}
          buttonLink={!isLoggedIn ? '/signup' : undefined}
          buttonClassName={clsx(
            'm-auto',
            'mb-32',
            'w-full',
            'max-w-[240px]',
            'text-lg',
            'p-3',
            'md:text-xl',
            'md:py-5',
            'md:px-4'
          )}
        />
        <div className={clsx('w-4/5', 'md:w-2/3')}>
          <div className={clsx('flex', 'flex-col', 'flex-wrap', 'md:flex-row')}>
            <div
              className={clsx(
                'h-16',
                'border-black',
                'rounded-r',
                'rounded-l',
                'md:rounded-r-none',
                'border-r',
                'border-b',
                'border-t',
                'border-l',
                'md:border-r-0',
                'flex',
                'items-center',
                'mb-4',
                'md:w-1/2'
              )}
            >
              <div
                className={clsx(
                  'border-r-0',
                  'border-black',
                  'flex',
                  'h-full',
                  'items-center',
                  'w-full'
                )}
              >
                <div className={clsx('pl-4', 'md:pl-10')}>
                  <Search />
                </div>
                <input
                  className={clsx(
                    'text-lg',
                    'pl-2',
                    'md:pl-5',
                    'h-full',
                    'w-full',
                    'font-favorit',
                    'bg-transparent',
                    'placeholder-black',
                    'focus:outline-none'
                  )}
                  placeholder="Search"
                  onChange={e => {
                    $setSearch(e.target.value)
                  }}
                  value={$search}
                />
              </div>
            </div>
            <div
              className={clsx(
                'h-16',
                'border',
                'border-black',
                'rounded-l',
                'rounded-r',
                'md:rounded-l-none',
                'flex',
                'items-center',
                'mb-4',
                'md:mb-8',
                'md:w-1/2'
              )}
            >
              <div
                className={clsx(
                  'border-r',
                  'border-black',
                  'flex',
                  'h-full',
                  'items-center',
                  'justify-between',
                  'w-1/2'
                )}
              >
                <label
                  className={clsx(
                    'flex',
                    'flex-col',
                    'font-favorit',
                    'text-xs',
                    'px-2.5',
                    'w-full'
                  )}
                >
                  Region:
                  {$country && $country.value && (
                    <Select {...$country} className="text-lg" />
                  )}
                </label>
              </div>
              <div
                className={clsx(
                  'h-full',
                  'flex',
                  'items-center',
                  'justify-between',
                  'w-1/2'
                )}
              >
                <label
                  className={clsx(
                    'flex',
                    'flex-col',
                    'font-favorit',
                    'text-xs',
                    'px-2.5',
                    'w-full'
                  )}
                >
                  View:
                  {$eventType && $eventType.value && (
                    <Select {...$eventType} className="text-lg" />
                  )}
                </label>
              </div>
            </div>
          </div>
          <div
            className={clsx(
              'font-extended',
              'flex',
              'px-4',
              'sm:px-10',
              'mb-4'
            )}
          >
            {users.length > 0 && (
              <>
                <div className={clsx('w-16', 'sm:w-24', 'hidden', 'md:inline')}>
                  RANK
                </div>
                <div className={clsx('flex-1', 'hidden', 'md:inline')}>
                  USERNAME
                </div>
                <div className={clsx('ml-2', 'hidden', 'md:inline')}>
                  TOTAL POINTS
                </div>
              </>
            )}
          </div>
          {$searching ? (
            <Loader />
          ) : users.length === 0 ? (
            <NoResults />
          ) : (
            users.map(user => (
              <div className="mb-3" key={user.id}>
                <Link href={`/users/${user.id}`}>
                  <a>
                    <LeaderboardRow
                      rank={user.rank}
                      graffiti={user.graffiti}
                      points={user.total_points}
                    />
                  </a>
                </Link>
              </div>
            ))
          )}
          <div
            className={clsx('flex', 'font-favorit', 'justify-center', 'mt-8')}
          >
            <div className={clsx('flex', 'gap-x-1.5')}>
              <PaginationButton
                disabled={!$hasPrevious}
                onClick={fetchPrevious}
              >{`<< Previous`}</PaginationButton>
              <div>{`|`}</div>
              <PaginationButton
                disabled={!$hasNext}
                onClick={fetchNext}
              >{`Next >>`}</PaginationButton>
            </div>
          </div>
        </div>
        <div className="mb-24"></div>
      </main>
      <Footer />
    </div>
  )
}
